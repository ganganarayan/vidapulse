'use strict';

/**
 * Embed route — /embed/:videoId
 *
 * Serves a self-contained HTML page that:
 *   1. Plays the video using the appropriate player for the source type
 *   2. Tracks play/pause/seek/end/heartbeat events automatically
 *   3. Reports analytics to /api/analytics/session + /api/analytics/ping
 *
 * The user embeds ONE line on their page:
 *   <iframe src="https://vidapulse.../embed/VIDEO_ID" width="560" height="315"
 *           frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>
 *
 * No JavaScript or extra steps required on the embedding page.
 * Tracking runs entirely inside the iframe.
 */

const express = require('express');
const router  = express.Router();
const { pool }  = require('../config/database');
const logger    = require('../config/logger');
const env       = require('../config/env');

// ── Allow this route to be framed by any domain ───────────────────────────
router.use((req, res, next) => {
  // Remove X-Frame-Options so iframe embedding works everywhere
  res.removeHeader('X-Frame-Options');
  // frame-ancestors * allows embedding on any domain
  res.setHeader('Content-Security-Policy', "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval' data: blob:");
  next();
});

// ─────────────────────────────────────────────────────────────────────────
// GET /embed/:videoId
// ─────────────────────────────────────────────────────────────────────────

router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params;

  // Basic UUID validation
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(videoId)) {
    return res.status(400).send(errorPage('Invalid video ID'));
  }

  try {
    const { rows: [video] } = await pool.query(
      `SELECT id, title, source_type, original_url, playable_url, processing_status
       FROM   videos
       WHERE  id = $1 AND is_active = TRUE`,
      [videoId]
    );

    if (!video) return res.status(404).send(errorPage('Video not found'));

    if (video.processing_status !== 'completed') {
      return res.status(200).type('html').send(loadingPage(video.title));
    }

    // Use APP_URL from env — never reconstruct from req.protocol which can be
    // 'http' behind Railway's reverse proxy, causing Mixed Content blocking.
    const apiBase  = env.APP_URL;
    const videoUrl = video.playable_url || video.original_url;

    // Load player settings (non-fatal — falls back to defaults)
    const DEFAULTS = {
      autoplay: false, autoplay_muted: true,
      show_seek_bar: true, show_play_pause_btn: true, show_playback_speed: true,
      show_fullscreen_btn: true, show_volume_control: true,
      resume_playback: false, loop: false, accent_color: '#F59E0B',
    };
    let playerSettings = { ...DEFAULTS };
    try {
      const { rows: [ps] } = await pool.query(
        `SELECT autoplay, autoplay_muted, show_seek_bar,
                show_play_pause_btn, show_playback_speed, show_fullscreen_btn,
                show_volume_control, resume_playback, loop, accent_color
         FROM   video_player_settings WHERE video_id = $1`,
        [videoId]
      );
      if (ps) playerSettings = { ...DEFAULTS, ...ps };
    } catch (_) { /* use defaults */ }

    res.type('html').send(buildEmbedPage(video, videoUrl, apiBase, playerSettings));

  } catch (err) {
    logger.error(`[embed] ${err.message}`, { videoId });
    return res.status(500).send(errorPage('Server error — please try again.'));
  }
});

// ─────────────────────────────────────────────────────────────────────────
// HTML builders
// ─────────────────────────────────────────────────────────────────────────

function buildEmbedPage(video, videoUrl, apiBase, ps = {}) {
  const { id, title, source_type } = video;

  // Individual player settings — every control has its own toggle
  const autoplay          = ps.autoplay            ?? false;
  const showPlayPause     = ps.show_play_pause_btn  ?? true;
  const showSeekBar       = ps.show_seek_bar        ?? true;
  const showSpeed         = ps.show_playback_speed  ?? true;
  const showFullscreen    = ps.show_fullscreen_btn  ?? true;
  const showVolumeControl = ps.show_volume_control  ?? true;
  const resumePlay        = ps.resume_playback      ?? false;
  const loopVideo         = ps.loop                ?? false;

  // Show the control bar only if at least one individual control is enabled
  const anyControls = showPlayPause || showSeekBar || showSpeed || showFullscreen || showVolumeControl;

  let playerHtml  = '';
  let extraScript = '';
  let extraStyles = '';

  // ── YouTube ─────────────────────────────────────────────────────────
  if (source_type === 'youtube') {
    const ytId = extractYouTubeId(videoUrl);
    playerHtml = `<div id="yt-wrap" style="position:relative;width:100%;height:100%">
      <div id="yt-player"></div>
    </div>`;
    extraScript = `
      var tag=document.createElement('script');
      tag.src='https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);

      var player;
      function onYouTubeIframeAPIReady(){
        player=new YT.Player('yt-player',{
          videoId:${JSON.stringify(ytId)},
          width:'100%',height:'100%',
          playerVars:{rel:0,modestbranding:1,controls:${anyControls ? 1 : 0}},
          events:{
            onReady:function(){
              sess();
              var _d=player.getDuration()||0;if(_d>0)dur=_d;
              setInterval(function(){
                if(player.getPlayerState&&player.getPlayerState()===YT.PlayerState.PLAYING){
                  var d=player.getDuration()||0;
                  var c=player.getCurrentTime()||0;
                  if(d>0&&on){
                    dur=d;
                    maxP=Math.max(maxP,c/d*100);
                    secs+=c-t0;
                    ivs.push([t0,c]);
                    t0=c;
                    ping('heartbeat');
                  }
                }
              },15000);
            },
            onStateChange:function(e){
              var S=YT.PlayerState;
              var c=player.getCurrentTime()||0;
              var d=player.getDuration()||0;
              if(e.data===S.PLAYING){
                if(!on){on=true;t0=c;ping('play');}
              }
              if(e.data===S.PAUSED){
                if(on){on=false;secs+=c-t0;ivs.push([t0,c]);
                  maxP=d>0?Math.max(maxP,c/d*100):maxP;ping('pause');}
              }
              if(e.data===S.ENDED){
                if(on){on=false;secs+=d-t0;ivs.push([t0,d]);}
                maxP=100;_ended=true;ping('end');
              }
            }
          }
        });
      }
    `;
  }

  // ── Vimeo ────────────────────────────────────────────────────────────
  else if (source_type === 'vimeo') {
    const vmId = extractVimeoId(videoUrl);
    playerHtml = `<iframe id="vm-player"
      src="https://player.vimeo.com/video/${esc(vmId)}?api=1&controls=${anyControls ? 1 : 0}"
      style="width:100%;height:100%;border:none"
      allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    extraScript = `
      var script=document.createElement('script');
      script.src='https://player.vimeo.com/api/player.js';
      script.onload=function(){
        var p=new Vimeo.Player('vm-player');
        sess();
        p.getDuration().then(function(d){if(d>0)dur=d;}).catch(function(){});
        p.on('play',function(d){
          if(!on){on=true;t0=d.seconds;ping('play');}
        });
        p.on('pause',function(d){
          if(on){on=false;secs+=d.seconds-t0;ivs.push([t0,d.seconds]);
            p.getDuration().then(function(dur){maxP=dur>0?Math.max(maxP,d.seconds/dur*100):maxP;});
            ping('pause');}
        });
        p.on('ended',function(){
          maxP=100;_ended=true;ping('end');
        });
        p.on('timeupdate',function(d){
          p.getDuration().then(function(dur){
            if(dur>0)maxP=Math.max(maxP,d.seconds/dur*100);
          });
        });
      };
      document.head.appendChild(script);
    `;
  }

  // ── HLS / MP4 / S3 / Azure (direct video) ───────────────────────────
  else if (['hls_stream','mp4_direct','amazon_s3','azure_blob'].includes(source_type)) {
    const isHls = source_type === 'hls_stream';
    const hasBar = showSeekBar || showSpeed || showFullscreen || showVolumeControl;

    // ── Bottom bar: left group (vol + seek + times) | right group (speed + fullscreen)
    const volHtml = showVolumeControl
      ? `<button class="vp-btn" id="vp-vol-btn" title="Mute">
           <svg id="vp-vol-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
         </button>
         <input type="range" id="vp-vol" min="0" max="100" value="100">` : '';
    const skHtml = showSeekBar
      ? `<span id="vp-cur">0:00</span>
         <input type="range" id="vp-seek" min="0" max="1000" value="0">
         <span id="vp-rem">-0:00</span>` : '';
    const spSel = showSpeed
      ? `<select id="vp-speed">
           <option value="0.5">0.5×</option><option value="1" selected>1×</option>
           <option value="1.25">1.25×</option><option value="1.5">1.5×</option>
           <option value="2">2×</option>
         </select>` : '';
    const fsBtn = showFullscreen
      ? `<button class="vp-btn" id="vp-fs" title="Fullscreen">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
         </button>` : '';
    const leftGroup  = (volHtml || skHtml) ? `<div id="vp-left">${volHtml}${skHtml}</div>`  : '';
    const rightGroup = (spSel || fsBtn)    ? `<div id="vp-right">${spSel}${fsBtn}</div>` : '';

    // ── Center overlay: [🔇 Unmute] [▶ Big Play/Pause]  (only if toggle is on)
    const centerHtml = showPlayPause
      ? `<div id="vp-center">
           <button id="vp-mute-c" title="Unmute">
             <svg id="vp-mute-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
               <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
             </svg>
           </button>
           <button id="vp-play-c" title="Play">
             <svg id="vp-play-icon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
               <polygon points="5 3 19 12 5 21 5 3"/>
             </svg>
           </button>
         </div>` : '';

    /* Resume prompt — only rendered when the "Resume playback" setting is on.
       Shown/hidden at runtime by attachVideoEvents based on whether a saved
       position exists. Always starts hidden (display:none). */
    const resumePromptHtml = resumePlay
      ? `<div id="vp-resume" style="display:none;bottom:8px">
           <button id="vp-res-start">&#x21BA; Start Over</button>
           <button id="vp-res-cont">&#x25B6; Resume</button>
         </div>`
      : '';

    playerHtml = `
      <video id="vp-vid" preload="metadata"
        ${autoplay ? 'autoplay muted playsinline' : 'playsinline'}
        ${loopVideo ? 'loop' : ''}
        style="width:100%;height:100%;display:block;background:#000">
        ${isHls ? '' : `<source src="${esc(videoUrl)}" />`}
      </video>
      ${centerHtml}
      ${resumePromptHtml}
      ${hasBar ? `<div id="vp-bar">${leftGroup}${rightGroup}</div>` : ''}`;

    extraStyles = `
      /* ── Resume prompt ──────────────────────────────── */
      #vp-resume{
        position:absolute;left:0;right:0;
        display:flex;justify-content:center;align-items:center;gap:10px;
        padding:0 12px;z-index:10;
      }
      #vp-resume button{
        background:rgba(22,22,22,0.88);
        border:1px solid rgba(255,255,255,0.18);
        color:#fff;font-size:12px;font-family:sans-serif;
        padding:7px 20px;border-radius:7px;cursor:pointer;
        backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
        transition:background .15s,transform .1s;
        white-space:nowrap;touch-action:manipulation;
      }
      #vp-resume button:hover{background:rgba(52,52,52,0.95);}
      #vp-resume button:active{transform:scale(.97);}
      /* Resume button gets a subtle amber accent */
      #vp-res-cont{border-color:rgba(245,158,11,0.45);}
      #vp-res-cont:hover{background:rgba(245,158,11,0.18);}

      /* ── Center overlay ─────────────────────────────── */
      #vp-center{
        position:absolute;inset:0;
        display:flex;align-items:center;justify-content:center;gap:18px;
        opacity:0;transition:opacity .25s;pointer-events:none;
      }
      /* Always visible when paused; visible on interaction when playing */
      #player-wrap.vp-paused #vp-center,
      #player-wrap.vp-active #vp-center{opacity:1;pointer-events:auto;}

      /* Big Play/Pause circle */
      #vp-play-c{
        width:70px;height:70px;border-radius:50%;
        background:rgba(245,158,11,.92);border:none;color:#fff;cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 24px rgba(0,0,0,.5);
        transition:transform .15s,background .15s;
        padding-left:4px;touch-action:manipulation;
      }
      #vp-play-c.vp-pause-mode{padding-left:0;}
      #vp-play-c:hover{background:rgba(245,158,11,1);transform:scale(1.08);}
      #vp-play-c:active{transform:scale(.96);}

      /* Unmute circle (center overlay) */
      #vp-mute-c{
        width:46px;height:46px;border-radius:50%;
        background:rgba(0,0,0,.55);border:2px solid rgba(255,255,255,.35);
        color:#fff;cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        transition:background .15s,transform .15s;touch-action:manipulation;
      }
      #vp-mute-c:hover{background:rgba(0,0,0,.75);transform:scale(1.08);}
      #vp-mute-c.vp-unmuted{border-color:rgba(245,158,11,.6);color:#f59e0b;}

      /* ── Bottom bar ──────────────────────────────────── */
      #vp-bar{
        position:absolute;bottom:0;left:0;right:0;
        padding:10px 12px 12px;
        background:linear-gradient(transparent,rgba(0,0,0,.85));
        display:flex;align-items:center;gap:8px;
        opacity:0;transition:opacity .25s;pointer-events:none;
      }
      #player-wrap.vp-paused #vp-bar,
      #player-wrap.vp-active #vp-bar{opacity:1;pointer-events:auto;}

      /* Left group: volume + seek + times; Right group: speed + fullscreen */
      #vp-left{display:flex;align-items:center;gap:6px;flex:1;min-width:0;}
      #vp-right{display:flex;align-items:center;gap:6px;flex-shrink:0;}

      .vp-btn{background:none;border:none;color:#fff;cursor:pointer;
        padding:4px;display:flex;align-items:center;flex-shrink:0;
        touch-action:manipulation;}
      .vp-btn:hover{color:#f59e0b;}

      /* Volume slider */
      #vp-vol{
        width:56px;-webkit-appearance:none;appearance:none;
        height:4px;border-radius:2px;flex-shrink:0;
        background:linear-gradient(to right,#f59e0b var(--vol,100%),rgba(255,255,255,.25) var(--vol,100%));
        cursor:pointer;outline:none;
      }
      #vp-vol::-webkit-slider-thumb{
        -webkit-appearance:none;width:11px;height:11px;
        border-radius:50%;background:#f59e0b;cursor:pointer;
        box-shadow:0 1px 4px rgba(0,0,0,.5);
      }
      #vp-vol::-moz-range-thumb{
        width:11px;height:11px;border-radius:50%;
        background:#f59e0b;cursor:pointer;border:none;
      }

      /* Time labels */
      #vp-cur,#vp-rem{
        color:rgba(255,255,255,.8);font-size:11px;white-space:nowrap;
        flex-shrink:0;font-family:sans-serif;
      }
      #vp-rem{color:rgba(255,255,255,.55);}

      /* Seek bar */
      #vp-seek{
        flex:1;-webkit-appearance:none;appearance:none;
        height:4px;border-radius:2px;
        background:linear-gradient(to right,#f59e0b var(--pct,0%),rgba(255,255,255,.25) var(--pct,0%));
        cursor:pointer;outline:none;min-width:40px;
      }
      #vp-seek::-webkit-slider-thumb{
        -webkit-appearance:none;width:13px;height:13px;
        border-radius:50%;background:#f59e0b;cursor:pointer;
        box-shadow:0 1px 4px rgba(0,0,0,.5);
      }
      #vp-seek::-moz-range-thumb{
        width:13px;height:13px;border-radius:50%;
        background:#f59e0b;cursor:pointer;border:none;
      }

      /* Speed selector */
      #vp-speed{
        background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.2);
        color:#fff;font-size:11px;padding:3px 5px;border-radius:4px;
        cursor:pointer;flex-shrink:0;
      }
    `;

    extraScript = `
      var v=document.getElementById('vp-vid');

      ${isHls ? `
      var s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
      s.onload=function(){
        if(Hls.isSupported()){var hls=new Hls();hls.loadSource(${JSON.stringify(videoUrl)});hls.attachMedia(v);}
        else if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=${JSON.stringify(videoUrl)};}
        attachVideoEvents(v);sess();
      };
      document.head.appendChild(s);
      ` : `attachVideoEvents(v);sess();`}

      function fmt(s){s=Math.floor(s||0);var m=Math.floor(s/60);return m+':'+('0'+(s%60)).slice(-2);}

      function attachVideoEvents(v){
        var pw     = document.getElementById('player-wrap');
        var playC  = document.getElementById('vp-play-c');
        var muteC  = document.getElementById('vp-mute-c');
        var sk     = document.getElementById('vp-seek');
        var curTm  = document.getElementById('vp-cur');
        var remTm  = document.getElementById('vp-rem');
        var sp     = document.getElementById('vp-speed');
        var fs     = document.getElementById('vp-fs');
        var volBtn = document.getElementById('vp-vol-btn');
        var volSl  = document.getElementById('vp-vol');
        var hideT  = null;

        /* ── UI show/hide ───────────────────────────── */
        function setUI(show){
          clearTimeout(hideT);
          if(show){
            pw&&pw.classList.add('vp-active');
            if(!v.paused)hideT=setTimeout(function(){pw&&pw.classList.remove('vp-active');},3000);
          } else {
            pw&&pw.classList.remove('vp-active');
          }
        }
        function syncPausedClass(){
          if(v.paused){pw&&pw.classList.add('vp-paused');}
          else{pw&&pw.classList.remove('vp-paused');}
        }
        /* Show on mouse move or touch */
        pw&&pw.addEventListener('mousemove',function(){setUI(true);});
        pw&&pw.addEventListener('touchstart',function(){setUI(true);},{passive:true});

        /* ── Resume playback prompt ─────────────────── */
        /* Show two buttons — "Start Over" and "Resume — M:SS" — above the
           control bar whenever the setting is on and a saved position exists.
           Dismisses when either button is clicked, or if play fires first. */
        var resumePos=loadPos();
        var resumeEl=document.getElementById('vp-resume');
        if(RESUME&&resumePos>5&&resumeEl&&v.paused){
          /* Sit 8px above the bar (or 8px from bottom if no bar) */
          var barEl=document.getElementById('vp-bar');
          resumeEl.style.bottom=((barEl?barEl.offsetHeight:0)+8)+'px';

          /* Update Resume button label with the saved timestamp */
          var resCont=document.getElementById('vp-res-cont');
          var resStart=document.getElementById('vp-res-start');
          if(resCont)resCont.textContent='▶ Resume – '+fmt(resumePos);

          /* Reveal the prompt */
          resumeEl.style.display='flex';

          function dismissResume(){if(resumeEl)resumeEl.style.display='none';}

          resStart&&resStart.addEventListener('click',function(e){
            e.stopPropagation();
            dismissResume();
            v.currentTime=0;
            v.play().catch(function(){});
          });
          resCont&&resCont.addEventListener('click',function(e){
            e.stopPropagation();
            dismissResume();
            v.currentTime=resumePos;
            v.play().catch(function(){});
          });
          /* If the viewer presses the main ▶ or taps the video directly,
             dismiss without seeking — video plays from its current position. */
          v.addEventListener('play',function(){dismissResume();},{once:true});
        }

        /* ── Click anywhere on video = play/pause ───── */
        pw&&pw.addEventListener('click',function(e){
          if(e.target.closest('button,input,select'))return;
          v.paused?v.play():v.pause();
          setUI(true);
        });

        /* ── Center play/pause button ───────────────── */
        var PLAY_SVG ='<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        var PAUSE_SVG='<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        function syncPlayIcon(){
          if(!playC)return;
          if(v.paused){playC.innerHTML=PLAY_SVG;playC.classList.remove('vp-pause-mode');playC.title='Play';}
          else{playC.innerHTML=PAUSE_SVG;playC.classList.add('vp-pause-mode');playC.title='Pause';}
        }
        playC&&playC.addEventListener('click',function(e){
          e.stopPropagation();
          v.paused?v.play():v.pause();
          setUI(true);
        });

        /* ── Unmute / mute button ───────────────────── */
        /* Initially muted SVG (X through speaker) */
        var MUTED_SVG  ='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
        var UNMUTED_SVG='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
        function syncMuteIcon(){
          if(!muteC)return;
          if(v.muted){muteC.innerHTML=MUTED_SVG;muteC.classList.remove('vp-unmuted');muteC.title='Unmute';}
          else{muteC.innerHTML=UNMUTED_SVG;muteC.classList.add('vp-unmuted');muteC.title='Mute';}
        }
        muteC&&muteC.addEventListener('click',function(e){
          e.stopPropagation();
          v.muted=!v.muted;
          if(!v.muted&&v.volume===0)v.volume=0.5;
          syncMuteIcon();syncVolIcon();
          setUI(true);
        });

        /* ── Volume control (bottom bar) ──────────────── */
        var VOL_MUTED_SVG='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
        var VOL_LOW_SVG  ='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
        var VOL_HIGH_SVG ='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
        function syncVolIcon(){
          if(!volBtn)return;
          if(v.muted||v.volume===0){volBtn.innerHTML=VOL_MUTED_SVG;volBtn.title='Unmute';}
          else if(v.volume<0.5){volBtn.innerHTML=VOL_LOW_SVG;volBtn.title='Mute';}
          else{volBtn.innerHTML=VOL_HIGH_SVG;volBtn.title='Mute';}
          if(volSl){var pct=v.muted?0:v.volume*100;volSl.value=pct;volSl.style.setProperty('--vol',pct+'%');}
        }
        volBtn&&volBtn.addEventListener('click',function(e){
          e.stopPropagation();
          v.muted=!v.muted;
          if(!v.muted&&v.volume===0)v.volume=0.5;
          syncVolIcon();syncMuteIcon();setUI(true);
        });
        volSl&&volSl.addEventListener('input',function(){
          var val=parseFloat(volSl.value)/100;
          v.volume=val;v.muted=(val===0);
          volSl.style.setProperty('--vol',volSl.value+'%');
          syncVolIcon();syncMuteIcon();
        });

        /* Sync initial state */
        syncPlayIcon();
        syncMuteIcon();
        syncVolIcon();
        syncPausedClass(); /* adds vp-paused if starting stopped */

        /* ── Video state events ─────────────────────── */
        v.addEventListener('play',function(){
          syncPlayIcon();
          syncPausedClass();
          setUI(true); /* brief show, then auto-hides */
        });
        v.addEventListener('pause',function(){
          syncPlayIcon();
          syncPausedClass(); /* keeps center visible */
          clearTimeout(hideT);
          pw&&pw.classList.add('vp-active');
        });
        v.addEventListener('ended',function(){
          syncPlayIcon();
          syncPausedClass();
        });
        v.addEventListener('volumechange',function(){syncMuteIcon();syncVolIcon();});

        /* ── Seek bar ───────────────────────────────── */
        if(sk){
          var dragging=false;
          function updateSeek(){
            if(v.duration){
              var p=(v.currentTime/v.duration)*100;
              sk.style.setProperty('--pct',p+'%');
              sk.value=(v.currentTime/v.duration)*1000;
            }
            if(curTm)curTm.textContent=fmt(v.currentTime);
            if(remTm){var rem=(v.duration||0)-(v.currentTime||0);remTm.textContent='-'+fmt(rem);}
          }
          v.addEventListener('timeupdate',function(){if(!dragging)updateSeek();});
          v.addEventListener('loadedmetadata',updateSeek);
          sk.addEventListener('mousedown',function(){dragging=true;});
          sk.addEventListener('touchstart',function(){dragging=true;},{passive:true});
          sk.addEventListener('input',function(){
            sk.style.setProperty('--pct',(sk.value/10)+'%');
            if(v.duration){
              var ct=(sk.value/1000)*v.duration;
              if(curTm)curTm.textContent=fmt(ct);
              if(remTm)remTm.textContent='-'+fmt(v.duration-ct);
            }
          });
          function commitSeek(){dragging=false;if(v.duration)v.currentTime=(sk.value/1000)*v.duration;}
          sk.addEventListener('change',commitSeek);
          sk.addEventListener('mouseup',commitSeek);
          /* iOS: touchend fires before 'change'; touchcancel (system interrupt — incoming
             call, swipe-back, notification) skips 'change' entirely and leaves
             dragging=true permanently, freezing the seek bar for the rest of the session. */
          sk.addEventListener('touchend',commitSeek,{passive:true});
          sk.addEventListener('touchcancel',function(){dragging=false;},{passive:true});
        }

        /* ── Playback speed ─────────────────────────── */
        sp&&(sp.onchange=function(){v.playbackRate=parseFloat(sp.value);});

        /* ── Fullscreen ─────────────────────────────── */
        var FS_IN ='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
        var FS_OUT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
        if(fs){
          fs.addEventListener('click',function(e){
            e.stopPropagation();
            /* Standard API first; webkit prefix for older Safari / iOS.
               iOS Safari does not support requestFullscreen() on arbitrary elements,
               but DOES support webkitEnterFullscreen() on the <video> element itself. */
            var isFs=!!(document.fullscreenElement||document.webkitFullscreenElement);
            if(isFs){
              if(document.exitFullscreen){document.exitFullscreen();}
              else if(document.webkitExitFullscreen){document.webkitExitFullscreen();}
            } else {
              var el=pw||v;
              if(el.requestFullscreen){el.requestFullscreen().catch(function(){});}
              else if(v.webkitEnterFullscreen){v.webkitEnterFullscreen();}
            }
          });
          /* Listen on both standard and webkit events so the icon syncs on iOS too */
          function _syncFsIcon(){
            if(fs)fs.innerHTML=(document.fullscreenElement||document.webkitFullscreenElement)?FS_OUT:FS_IN;
          }
          document.addEventListener('fullscreenchange',_syncFsIcon);
          document.addEventListener('webkitfullscreenchange',_syncFsIcon);
        }

        /* ── Analytics ──────────────────────────────── */
        v.addEventListener('loadedmetadata',function(){if(v.duration>0)dur=v.duration;});
        v.addEventListener('play',function(){if(!on){on=true;t0=v.currentTime;curPos=v.currentTime;ping('play');}});
        v.addEventListener('pause',function(){
          if(on){on=false;var e=v.currentTime;curPos=e;secs+=e-t0;ivs.push([t0,e]);
            maxP=v.duration>0?Math.max(maxP,e/v.duration*100):maxP;ping('pause');}
        });
        v.addEventListener('ended',function(){
          if(on){on=false;var e=v.currentTime;curPos=e;secs+=e-t0;ivs.push([t0,e]);}
          maxP=100;curPos=v.duration||curPos;
          /* Mark complete BEFORE pinging so _onUnload (pagehide / beforeunload)
             does not fire a second ping if the user closes the tab right after
             the video finishes. */
          _ended=true;
          ping('end');
        });
        v.addEventListener('seeked',function(){
          curPos=v.currentTime;
          if(on){var e=v.currentTime;secs+=e-t0;ivs.push([t0,e]);t0=e;}
        });
        /* Heartbeat every 15 s: flush the current in-progress interval so the
           server has reliable data even if the user never pauses or ends.
           Closes the interval at "now" and resets t0, so subsequent
           pause/end pings only report new seconds (no double-count). */
        setInterval(function(){
          if(on&&v.duration>0){
            var now=v.currentTime;
            curPos=now;
            maxP=Math.max(maxP,now/v.duration*100);
            dur=v.duration;
            secs+=now-t0;
            ivs.push([t0,now]);
            t0=now;
            ping('heartbeat');
          }
          if(RESUME&&on){savePos(v.currentTime);}
        },15000);
      }
    `;
  }

  // ── Loom / Zoom / Google Drive / other iframe sources ────────────────
  else {
    const embedUrl = buildIframeSrc(source_type, videoUrl);
    playerHtml = `<iframe
      src="${esc(embedUrl)}"
      style="width:100%;height:100%;border:none"
      allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    extraScript = `sess();`; // basic session tracking only
  }

  // ── Shared tracking variables + helpers ─────────────────────────────
  const trackerCore = `
    var API=${JSON.stringify(apiBase+'/api')};
    var VID=${JSON.stringify(id)};
    var RESUME=${JSON.stringify(resumePlay)};

    console.log('[VidaPulse] tracker loaded — API:', API, '| video:', VID);

    /* Persistent viewer cookie
       All localStorage calls are wrapped in try/catch:
       iOS Safari Private Browsing allows getItem() but throws QuotaExceededError
       on setItem() — without the guard the script crashes before sess() runs. */
    var k='_vp_'+VID.slice(0,8),ck=null;
    try{ck=localStorage.getItem(k);}catch(_){}
    if(!ck){
      try{
        ck=([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,function(c){
          return(c^(crypto.getRandomValues(new Uint8Array(1))[0]&(15>>c/4))).toString(16);
        });
      }catch(e){ck=Math.random().toString(36).slice(2)+Date.now().toString(36);}
      try{localStorage.setItem(k,ck);}catch(_){}
    }
    console.log('[VidaPulse] viewer cookie:', ck);

    var sid=null, pq=[], on=false,t0=0,maxP=0,secs=0,ivs=[],dur=0,curPos=0;
    var dv=window.innerWidth<768?'mobile':window.innerWidth<1024?'tablet':'desktop';

    function sess(){
      console.log('[VidaPulse] creating session...');
      fetch(API+'/analytics/session',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({video_id:VID,viewer_cookie:ck,
          page_url:document.referrer||location.href,
          referrer:document.referrer,device_type:dv,
          screen_width:screen.width,screen_height:screen.height,
          user_agent:navigator.userAgent})
      }).then(function(r){
        console.log('[VidaPulse] session HTTP status:', r.status);
        return r.json();
      }).then(function(d){
        if(!d||!d.session_id){
          console.error('[VidaPulse] session bad response — no session_id:', JSON.stringify(d));
          return;
        }
        sid=d.session_id;
        console.log('[VidaPulse] session created:', sid);
        /* Notify parent window so CTA-click tracking works on the embedding page */
        try{if(window.parent!==window)window.parent.postMessage(
          {type:'vidapulse_session',session_id:sid,video_id:VID},'*');}
        catch(_){}
        /* Flush any pings that fired before the session was ready.
           This is the normal case — play events almost always arrive
           before the async session fetch returns (~200-500 ms on Railway). */
        if(pq.length){
          console.log('[VidaPulse] flushing',pq.length,'queued ping(s):', pq.join(','));
          var q=pq.splice(0);
          q.forEach(function(ev){ping(ev);});
        }
      }).catch(function(e){
        console.error('[VidaPulse] session error:', e);
      });
    }

    function ping(ev){
      if(!sid){pq.push(ev);console.log('[VidaPulse] queued (no session yet):',ev);return;}
      /* Drain ivs so each ping only reports NEW intervals.
         On failure they are restored at the front so the next ping retries them.
         This prevents double-counting when heartbeats overlap with pause/end events. */
      var toSend=ivs.splice(0);
      var body=JSON.stringify({session_id:sid,video_id:VID,event:ev,
        max_pct:maxP,watch_seconds:secs,intervals:toSend,
        duration_seconds:dur>0?dur:undefined,
        position:curPos>0?curPos:undefined});
      console.log('[VidaPulse] ping →',ev,'| sid:',sid.slice(0,8),'| maxPct:',maxP.toFixed(1),'| secs:',secs.toFixed(1),'| ivs:',toSend.length);
      /* Use fetch+keepalive — works mid-session AND on page unload.
         sendBeacon is NOT used: it returns false silently on failure
         (no exception), so the catch block never runs and pings vanish. */
      fetch(API+'/analytics/ping',{
        method:'POST',keepalive:true,
        headers:{'Content-Type':'application/json'},body:body
      }).then(function(r){
        console.log('[VidaPulse] ping ✓',ev,'→ HTTP',r.status);
      }).catch(function(e){
        console.warn('[VidaPulse] ping ✗',ev,'→',e.message);
        /* Restore intervals so next ping can retry */
        if(toSend.length>0)Array.prototype.unshift.apply(ivs,toSend);
        /* last-ditch fallback for unload scenario */
        try{navigator.sendBeacon&&navigator.sendBeacon(
          API+'/analytics/ping',new Blob([body],{type:'application/json'}));}
        catch(_){}
      });
    }

    /* Resume playback helper — localStorage wrapped for iOS Private mode */
    var rpKey='_vp_pos_'+VID.slice(0,8);
    function savePos(t){if(RESUME&&t>5){try{localStorage.setItem(rpKey,t);}catch(_){}}}
    function loadPos(){try{return RESUME?parseFloat(localStorage.getItem(rpKey)||'0'):0;}catch(_){return 0;}}

    /* Flush remaining watch data on page unload.
       iOS Safari does NOT reliably fire 'beforeunload' — it fires 'pagehide' instead.
       Desktop browsers fire both. The _ended guard prevents double-counting on
       browsers that fire both events (Chrome, Firefox, Edge on desktop).

       IMPORTANT: send 'heartbeat', NOT 'end'. Page-close is NOT completion —
       the video 'ended' event is the only authoritative signal for reached_end.
       Sending 'end' here was setting reached_end=true for every page-close,
       inflating the completion rate to ~100% regardless of watch depth. */
    var _ended=false;
    function _onUnload(){
      if(_ended)return;
      _ended=true;
      if(on&&typeof t0!=='undefined'){
        var now=(typeof player!=='undefined'&&player.getCurrentTime)
          ?player.getCurrentTime()
          :(document.getElementById('vp-vid')?document.getElementById('vp-vid').currentTime:t0);
        savePos(now);
        secs+=now-t0;ivs.push([t0,now]);
      }
      ping('heartbeat');
    }
    window.addEventListener('beforeunload',_onUnload);
    /* pagehide: fires reliably on iOS Safari (and all modern browsers).
       Use {capture:true} so it runs before any other handler can cancel it. */
    window.addEventListener('pagehide',_onUnload,{capture:true});
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title ?? 'Video')}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#000}
    #player-wrap{position:absolute;inset:0;overflow:hidden;
      /* Removes the 300ms click delay on iOS Safari for all tap interactions */
      touch-action:manipulation;}
    #player-wrap>iframe,#player-wrap>video{width:100%;height:100%;display:block}
    #yt-wrap,#yt-wrap>div{position:absolute;inset:0}
    #yt-player{position:absolute;inset:0}
    ${extraStyles}
  </style>
</head>
<body>
  <div id="player-wrap">
    ${playerHtml}
  </div>
  <script>
    ${trackerCore}
    ${extraScript}
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────
// URL extractors
// ─────────────────────────────────────────────────────────────────────────

function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split(/[?&]/)[0];
    return u.searchParams.get('v') ?? '';
  } catch { return ''; }
}

function extractVimeoId(url) {
  try {
    return new URL(url).pathname.replace(/^\//, '').split('/')[0];
  } catch { return ''; }
}

function buildIframeSrc(sourceType, originalUrl) {
  // For known sources, convert to their embed URL format
  try {
    if (sourceType === 'loom') {
      // loom.com/share/ID → loom.com/embed/ID
      return originalUrl.replace('/share/', '/embed/');
    }
    if (sourceType === 'google_drive') {
      // drive.google.com/file/d/ID/view → drive.google.com/file/d/ID/preview
      return originalUrl.replace('/view', '/preview').replace('/edit', '/preview');
    }
  } catch (_) {}
  return originalUrl;
}

// ── Simple HTML escaping ─────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─────────────────────────────────────────────────────────────────────────
// Error / loading pages
// ─────────────────────────────────────────────────────────────────────────

function errorPage(msg) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>*{margin:0}body{background:#111;color:#999;font-family:sans-serif;
    display:flex;align-items:center;justify-content:center;height:100vh;text-align:center}
  </style></head><body><p>${esc(msg)}</p></body></html>`;
}

function loadingPage(title) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>*{margin:0}body{background:#111;color:#666;font-family:sans-serif;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    height:100vh;gap:12px;text-align:center}
  .spin{width:24px;height:24px;border:2px solid #f59e0b;border-top-color:transparent;
    border-radius:50%;animation:s 0.8s linear infinite}
  @keyframes s{to{transform:rotate(360deg)}}
  </style></head><body>
  <div class="spin"></div>
  <p style="font-size:13px">${esc(title ?? 'Video')} · Processing…</p>
  </body></html>`;
}

module.exports = router;
