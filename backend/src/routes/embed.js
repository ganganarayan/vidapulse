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
      autoplay: false, autoplay_muted: true, show_controls: true,
      show_seek_bar: true, show_play_pause_btn: true, show_playback_speed: true,
      show_fullscreen_btn: true, resume_playback: false, loop: false, accent_color: '#F59E0B',
    };
    let playerSettings = { ...DEFAULTS };
    try {
      const { rows: [ps] } = await pool.query(
        `SELECT autoplay, autoplay_muted, show_controls, show_seek_bar,
                show_play_pause_btn, show_playback_speed, show_fullscreen_btn,
                resume_playback, loop, accent_color
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

  // Individual player settings (show_controls removed — every control has its own toggle)
  const autoplay       = ps.autoplay           ?? false;
  const showPlayPause  = ps.show_play_pause_btn ?? true;
  const showSeekBar    = ps.show_seek_bar       ?? true;
  const showSpeed      = ps.show_playback_speed ?? true;
  const showFullscreen = ps.show_fullscreen_btn ?? true;
  const resumePlay     = ps.resume_playback     ?? false;
  const loopVideo      = ps.loop               ?? false;

  // Show the control bar only if at least one individual control is enabled
  const anyControls = showPlayPause || showSeekBar || showSpeed || showFullscreen;

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
              setInterval(function(){
                if(player.getPlayerState&&player.getPlayerState()===YT.PlayerState.PLAYING){
                  var d=player.getDuration()||0;
                  var c=player.getCurrentTime()||0;
                  maxP=d>0?Math.max(maxP,c/d*100):maxP;
                }
              },10000);
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
                maxP=100;ping('end');
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
        p.on('play',function(d){
          if(!on){on=true;t0=d.seconds;ping('play');}
        });
        p.on('pause',function(d){
          if(on){on=false;secs+=d.seconds-t0;ivs.push([t0,d.seconds]);
            p.getDuration().then(function(dur){maxP=dur>0?Math.max(maxP,d.seconds/dur*100):maxP;});
            ping('pause');}
        });
        p.on('ended',function(){
          maxP=100;ping('end');
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
  // Custom control bar: each button only rendered when its toggle is ON.
  // Turning off all 4 individual toggles hides the bar entirely.
  else if (['hls_stream','mp4_direct','amazon_s3','azure_blob'].includes(source_type)) {
    const isHls = source_type === 'hls_stream';

    // Build only the control elements that are enabled
    const ppBtn = showPlayPause
      ? `<button class="vp-btn" id="vp-pp" title="Play/Pause">
           <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
         </button>` : '';
    const skBar = showSeekBar
      ? `<input type="range" id="vp-seek" min="0" max="1000" value="0">` : '';
    const tmDisp = (showSeekBar || showPlayPause)
      ? `<span id="vp-time">0:00</span>` : '';
    const spSel = showSpeed
      ? `<select id="vp-speed">
           <option value="0.5">0.5×</option>
           <option value="1" selected>1×</option>
           <option value="1.25">1.25×</option>
           <option value="1.5">1.5×</option>
           <option value="2">2×</option>
         </select>` : '';
    const fsBtn = showFullscreen
      ? `<button class="vp-btn" id="vp-fs" title="Fullscreen">
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
         </button>` : '';

    playerHtml = `<video id="vp-vid" preload="metadata"
      ${autoplay ? 'autoplay muted playsinline' : 'playsinline'}
      ${loopVideo ? 'loop' : ''}
      style="width:100%;height:100%;display:block;background:#000">
      ${isHls ? '' : `<source src="${esc(videoUrl)}" />`}
    </video>
    ${anyControls ? `<div id="vp-bar">${ppBtn}${skBar}${tmDisp}${spSel}${fsBtn}</div>` : ''}`;

    extraStyles = `
      #vp-bar{position:absolute;bottom:0;left:0;right:0;
        padding:8px 10px 10px;
        background:linear-gradient(transparent,rgba(0,0,0,.8));
        display:flex;align-items:center;gap:8px;
        opacity:0;transition:opacity .25s;pointer-events:none;}
      #player-wrap:hover #vp-bar,#player-wrap.show-bar #vp-bar{opacity:1;pointer-events:auto;}
      .vp-btn{background:none;border:none;color:#fff;cursor:pointer;
        padding:3px 4px;display:flex;align-items:center;flex-shrink:0;line-height:1;}
      .vp-btn:hover{color:#f59e0b;}
      #vp-seek{flex:1;-webkit-appearance:none;appearance:none;
        height:3px;border-radius:2px;
        background:linear-gradient(to right,#f59e0b var(--pct,0%),rgba(255,255,255,.25) var(--pct,0%));
        cursor:pointer;outline:none;min-width:30px;}
      #vp-seek::-webkit-slider-thumb{-webkit-appearance:none;
        width:11px;height:11px;border-radius:50%;background:#f59e0b;cursor:pointer;margin-top:-4px;}
      #vp-seek::-moz-range-thumb{width:11px;height:11px;border-radius:50%;
        background:#f59e0b;cursor:pointer;border:none;}
      #vp-time{color:rgba(255,255,255,.75);font-size:11px;white-space:nowrap;
        flex-shrink:0;font-family:sans-serif;}
      #vp-speed{background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.2);
        color:#fff;font-size:11px;padding:2px 4px;border-radius:3px;
        cursor:pointer;flex-shrink:0;}
    `;

    extraScript = `
      var v=document.getElementById('vp-vid');

      ${isHls ? `
      var s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
      s.onload=function(){
        if(Hls.isSupported()){
          var hls=new Hls();
          hls.loadSource(${JSON.stringify(videoUrl)});
          hls.attachMedia(v);
        } else if(v.canPlayType('application/vnd.apple.mpegurl')){
          v.src=${JSON.stringify(videoUrl)};
        }
        attachVideoEvents(v);
        sess();
      };
      document.head.appendChild(s);
      ` : `
      attachVideoEvents(v);
      sess();
      `}

      /* Format seconds → m:ss */
      function fmt(s){s=Math.floor(s||0);var m=Math.floor(s/60);return m+':'+('0'+(s%60)).slice(-2);}

      function attachVideoEvents(v){
        var pp=document.getElementById('vp-pp');
        var sk=document.getElementById('vp-seek');
        var tm=document.getElementById('vp-time');
        var sp=document.getElementById('vp-speed');
        var fs=document.getElementById('vp-fs');
        var pw=document.getElementById('player-wrap');

        /* Auto-show bar briefly on tap (mobile) */
        if(pw){
          pw.addEventListener('click',function(){
            pw.classList.add('show-bar');
            clearTimeout(pw._bt);
            pw._bt=setTimeout(function(){pw.classList.remove('show-bar');},3000);
          });
        }

        /* Resume playback */
        var resumePos=loadPos();
        if(resumePos>5){v.currentTime=resumePos;}

        /* Play/Pause button */
        var PLAY_ICON='<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        var PAUSE_ICON='<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        if(pp){
          pp.onclick=function(e){e.stopPropagation();v.paused?v.play():v.pause();};
          v.addEventListener('play',function(){if(pp)pp.innerHTML=PAUSE_ICON;});
          v.addEventListener('pause',function(){if(pp)pp.innerHTML=PLAY_ICON;});
          v.addEventListener('ended',function(){if(pp)pp.innerHTML=PLAY_ICON;});
        }

        /* Seek bar */
        if(sk){
          var dragging=false;
          function updateBar(){
            if(v.duration){
              var p=(v.currentTime/v.duration)*100;
              sk.style.setProperty('--pct',p+'%');
              sk.value=(v.currentTime/v.duration)*1000;
            }
            if(tm)tm.textContent=fmt(v.currentTime);
          }
          v.addEventListener('timeupdate',function(){if(!dragging)updateBar();});
          v.addEventListener('loadedmetadata',updateBar);
          sk.addEventListener('mousedown',function(){dragging=true;});
          sk.addEventListener('touchstart',function(){dragging=true;},{passive:true});
          sk.addEventListener('input',function(){
            var pct=(sk.value/1000)*100;
            sk.style.setProperty('--pct',pct+'%');
            if(tm&&v.duration)tm.textContent=fmt((sk.value/1000)*v.duration);
          });
          sk.addEventListener('change',function(){
            dragging=false;
            if(v.duration)v.currentTime=(sk.value/1000)*v.duration;
          });
          sk.addEventListener('mouseup',function(){
            dragging=false;
            if(v.duration)v.currentTime=(sk.value/1000)*v.duration;
          });
        }

        /* Playback speed */
        if(sp){sp.onchange=function(){v.playbackRate=parseFloat(sp.value);};}

        /* Fullscreen */
        var FS_ENTER='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
        var FS_EXIT='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
        if(fs){
          fs.onclick=function(e){
            e.stopPropagation();
            if(document.fullscreenElement){document.exitFullscreen();}
            else{(pw||v).requestFullscreen().catch(function(){});}
          };
          document.addEventListener('fullscreenchange',function(){
            if(fs)fs.innerHTML=document.fullscreenElement?FS_EXIT:FS_ENTER;
          });
        }

        /* Analytics events */
        v.addEventListener('play',function(){
          if(!on){on=true;t0=v.currentTime;ping('play');}
        });
        v.addEventListener('pause',function(){
          if(on){on=false;var e=v.currentTime;secs+=e-t0;ivs.push([t0,e]);
            maxP=v.duration>0?Math.max(maxP,e/v.duration*100):maxP;ping('pause');}
        });
        v.addEventListener('ended',function(){
          if(on){on=false;var e=v.currentTime;secs+=e-t0;ivs.push([t0,e]);}
          maxP=100;ping('end');
        });
        v.addEventListener('seeked',function(){
          if(on){var e=v.currentTime;secs+=e-t0;ivs.push([t0,e]);t0=e;}
        });
        setInterval(function(){
          if(on&&v.duration>0){maxP=Math.max(maxP,v.currentTime/v.duration*100);}
          if(RESUME&&on){savePos(v.currentTime);}
        },10000);
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

    /* Persistent viewer cookie */
    var k='_vp_'+VID.slice(0,8),ck=localStorage.getItem(k);
    if(!ck){
      try{
        ck=([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,function(c){
          return(c^(crypto.getRandomValues(new Uint8Array(1))[0]&(15>>c/4))).toString(16);
        });
      }catch(e){ck=Math.random().toString(36).slice(2)+Date.now().toString(36);}
      localStorage.setItem(k,ck);
    }
    console.log('[VidaPulse] viewer cookie:', ck);

    var sid=null,on=false,t0=0,maxP=0,secs=0,ivs=[];
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
        sid=d.session_id;
        console.log('[VidaPulse] session created:', sid);
      }).catch(function(e){
        console.error('[VidaPulse] session error:', e);
      });
    }

    function ping(ev){
      if(!sid){console.warn('[VidaPulse] ping skipped — no session yet, event:', ev);return;}
      console.log('[VidaPulse] ping event:', ev, '| maxPct:', maxP.toFixed(1), '| watchSecs:', secs.toFixed(1));
      var body=JSON.stringify({session_id:sid,video_id:VID,event:ev,
        max_pct:maxP,watch_seconds:secs,intervals:ivs});
      /* sendBeacon must use a Blob with explicit JSON type —
         passing a plain string sends as text/plain which Express
         cannot parse, silently dropping every analytics event. */
      if(navigator.sendBeacon){
        try{navigator.sendBeacon(API+'/analytics/ping',new Blob([body],{type:'application/json'}));}
        catch(e){fetch(API+'/analytics/ping',{method:'POST',keepalive:true,
          headers:{'Content-Type':'application/json'},body:body});}
      }else{fetch(API+'/analytics/ping',{method:'POST',keepalive:true,
        headers:{'Content-Type':'application/json'},body:body});}
    }

    /* Resume playback helper */
    var rpKey='_vp_pos_'+VID.slice(0,8);
    function savePos(t){if(RESUME&&t>5)localStorage.setItem(rpKey,t);}
    function loadPos(){return RESUME?parseFloat(localStorage.getItem(rpKey)||'0'):0;}

    window.addEventListener('beforeunload',function(){
      if(on&&typeof t0!=='undefined'){
        var now=(typeof player!=='undefined'&&player.getCurrentTime)
          ?player.getCurrentTime()
          :(document.getElementById('vp-vid')?document.getElementById('vp-vid').currentTime:t0);
        savePos(now);
        secs+=now-t0;ivs.push([t0,now]);
      }
      ping('end');
    });
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
    #player-wrap{position:absolute;inset:0;overflow:hidden}
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
