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

    const apiBase  = `${req.protocol}://${req.get('host')}`;
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
  // Player settings with safe defaults
  const autoplay     = ps.autoplay     ?? false;
  const showControls = ps.show_controls ?? true;
  const showSeekBar  = ps.show_seek_bar ?? true;
  const showSpeed    = ps.show_playback_speed ?? true;
  const resumePlay   = ps.resume_playback ?? false;
  const loopVideo    = ps.loop ?? false;

  let playerHtml  = '';
  let extraScript = '';

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
          playerVars:{rel:0,modestbranding:1},
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
      src="https://player.vimeo.com/video/${esc(vmId)}?api=1"
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
  else if (['hls_stream','mp4_direct','amazon_s3','azure_blob'].includes(source_type)) {
    const isHls = source_type === 'hls_stream';
    playerHtml = `<video id="vp-vid" preload="metadata"
      ${showControls ? 'controls' : ''}
      ${autoplay ? 'autoplay muted' : ''}
      ${loopVideo ? 'loop' : ''}
      style="width:100%;height:100%;background:#000">
      ${isHls ? '' : `<source src="${esc(videoUrl)}" />`}
      Your browser does not support video playback.
    </video>`;
    extraScript = `
      var v=document.getElementById('vp-vid');

      ${isHls ? `
      /* Load HLS.js from CDN for HLS streams */
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

      function attachVideoEvents(v){
        /* Resume playback — seek to stored position on first load */
        var resumePos=loadPos();
        if(resumePos>0){v.currentTime=resumePos;}

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

    var sid=null,on=false,t0=0,maxP=0,secs=0,ivs=[];
    var dv=window.innerWidth<768?'mobile':window.innerWidth<1024?'tablet':'desktop';

    function sess(){
      fetch(API+'/analytics/session',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({video_id:VID,viewer_cookie:ck,
          page_url:document.referrer||location.href,
          referrer:document.referrer,device_type:dv,
          screen_width:screen.width,screen_height:screen.height,
          user_agent:navigator.userAgent})
      }).then(function(r){return r.json();}).then(function(d){sid=d.session_id;});
    }

    function ping(ev){
      if(!sid)return;
      var body=JSON.stringify({session_id:sid,video_id:VID,event:ev,
        max_pct:maxP,watch_seconds:secs,intervals:ivs});
      if(navigator.sendBeacon){navigator.sendBeacon(API+'/analytics/ping',body);}
      else{fetch(API+'/analytics/ping',{method:'POST',keepalive:true,
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
    #player-wrap{position:absolute;inset:0;display:flex;align-items:stretch}
    #player-wrap>*{flex:1}
    #yt-player{position:absolute;inset:0}
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
