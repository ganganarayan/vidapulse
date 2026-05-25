'use strict';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { VideoSidebar } from '../components/AppLayout';
import VideoAnalyticsView from '../components/dashboard/VideoAnalyticsView';

/**
 * VideoDetail
 *
 * Per-video analytics page. Manages four view-states:
 *
 *   initialising — first render, loading video from API
 *   processing   — video is being processed; shows sequential animation + polls
 *   ready        — full two-panel dashboard (VideoSidebar + VideoAnalyticsView)
 *   error        — processing failed or network error
 *
 * The `animateIn` flag triggers the staggered reveal animation in
 * VideoAnalyticsView on the first visit after processing completes.
 */

// ─────────────────────────────────────────────────────────────────────────
// Processing screen constants
// ─────────────────────────────────────────────────────────────────────────

const STEPS = [
  { active: 'Identifying your video platform', done: null },
  { active: 'Fetching video details',           done: 'Video details loaded' },
  { active: 'Connecting your analytics tracker', done: 'Analytics tracker ready' },
  { active: 'Generating your embed code',        done: 'Embed code generated' },
  { active: 'Finalising your dashboard',         done: 'Dashboard ready' },
];

const STEP_MS               = 1800;
const ANIMATION_DURATION_MS = STEPS.length * STEP_MS;
const POLL_INTERVAL_MS      = 3_000;

const PLATFORM_LABELS = {
  youtube: 'YouTube', vimeo: 'Vimeo', loom: 'Loom', zoom: 'Zoom',
  google_drive: 'Google Drive', dropbox: 'Dropbox',
  mp4_direct: 'Direct MP4', hls_stream: 'HLS Stream', other: 'Video',
};

// ─────────────────────────────────────────────────────────────────────────
// VideoDetail — main export
// ─────────────────────────────────────────────────────────────────────────

export default function VideoDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [viewState,    setViewState]    = useState('initialising');
  const [video,        setVideo]        = useState(null);
  const [fetchError,   setFetchError]   = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeView,   setActiveView]   = useState('overview');
  const [animateIn,    setAnimateIn]    = useState(false);

  // ── Initial fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/videos/${id}`)
      .then(res => {
        const v = res.data.video;
        setVideo(v);
        if (v.processing_status === 'completed') {
          setViewState('ready');        // return visit — no animation
          setAnimateIn(false);
        } else if (v.processing_status === 'failed') {
          setFetchError('Video processing failed. Please try again.');
          setViewState('error');
        } else {
          setViewState('processing');   // first visit — animation on completion
        }
      })
      .catch(err => {
        setFetchError(
          err.response?.status === 404
            ? 'Video not found.'
            : 'Could not load video. Please refresh.'
        );
        setViewState('error');
      });
  }, [id]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    api.get(`/videos/${id}`)
      .then(res => setVideo(res.data.video))
      .catch(() => {})
      .finally(() => setIsRefreshing(false));
  }, [id]);

  // ── Render ─────────────────────────────────────────────────────────────

  if (viewState === 'initialising') {
    return <FullPageSpinner />;
  }

  if (viewState === 'error') {
    return <ErrorState message={fetchError} onBack={() => navigate('/dashboard')} />;
  }

  if (viewState === 'processing') {
    return (
      <ProcessingScreen
        video={video}
        videoId={id}
        onVideoUpdate={setVideo}
        onComplete={() => {
          setAnimateIn(true);
          setViewState('ready');
        }}
      />
    );
  }

  // viewState === 'ready' — two-panel dashboard
  return (
    <div className="min-h-screen bg-gray-900 flex overflow-hidden" style={{ height: '100vh' }}>
      {/* Left: Video-context sidebar */}
      <VideoSidebar
        video={video}
        user={user}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Right: Content area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <VideoAnalyticsView
          video={video}
          user={user}
          activeView={activeView}
          onViewChange={setActiveView}
          animateIn={animateIn}
          onAnimationComplete={() => setAnimateIn(false)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ProcessingScreen — sequential step animation + backend polling
// ─────────────────────────────────────────────────────────────────────────

function ProcessingScreen({ video, videoId, onVideoUpdate, onComplete }) {
  const [activeStep,  setActiveStep]  = useState(0);
  const [doneSteps,   setDoneSteps]   = useState(new Set());
  const [animDone,    setAnimDone]    = useState(false);
  const [backendDone, setBackendDone] = useState(
    video?.processing_status === 'completed'
  );
  const transitionFiredRef = useRef(false);

  // Step animation
  useEffect(() => {
    const timers = [];
    STEPS.forEach((_, idx) => {
      timers.push(setTimeout(() => setActiveStep(idx), idx * STEP_MS));
      timers.push(setTimeout(() => {
        setDoneSteps(prev => new Set([...prev, idx]));
      }, idx * STEP_MS + 800));
    });
    timers.push(setTimeout(() => setAnimDone(true), ANIMATION_DURATION_MS));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Backend polling
  useEffect(() => {
    if (backendDone) return;
    const intervalId = setInterval(() => {
      api.get(`/videos/${videoId}`)
        .then(res => {
          const v = res.data.video;
          onVideoUpdate(v);
          if (v.processing_status === 'completed' || v.processing_status === 'failed') {
            setBackendDone(true);
          }
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    const maxTimer = setTimeout(() => setBackendDone(true), 60_000);
    return () => { clearInterval(intervalId); clearTimeout(maxTimer); };
  }, [videoId, backendDone, onVideoUpdate]);

  // Transition gate
  useEffect(() => {
    if (animDone && backendDone && !transitionFiredRef.current) {
      transitionFiredRef.current = true;
      setTimeout(onComplete, 400);
    }
  }, [animDone, backendDone, onComplete]);

  const completedCount = doneSteps.size;
  const progressPct    = animDone ? 100 : Math.round((completedCount / STEPS.length) * 95);
  const platformLabel  = video?.source_type
    ? (PLATFORM_LABELS[video.source_type] ?? 'Video')
    : 'Video';

  function stepDoneLabel(idx) {
    if (idx === 0) return `${platformLabel} detected`;
    return STEPS[idx].done;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center gap-2">
        <span className="text-amber-500 text-xl select-none">{'▶︎'}</span>
        <span className="text-lg font-bold text-amber-500 tracking-tight">VidaPulse</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {/* Animated orb */}
          <div className="flex justify-center mb-10">
            <div className="relative w-20 h-20">
              <span className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
              <span className="absolute inset-2 rounded-full bg-amber-500/10 border border-amber-500/30" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-6 h-6 rounded-full bg-amber-500/80" />
              </span>
            </div>
          </div>

          <h1 className="text-center text-xl font-bold text-gray-50 mb-1">
            Setting up your analytics
          </h1>
          {video?.title && (
            <p className="text-center text-sm text-gray-500 mb-8 truncate px-4">
              {video.title}
            </p>
          )}
          {!video?.title && <div className="mb-8" />}

          {/* Steps */}
          <div className="flex flex-col gap-3 mb-8">
            {STEPS.map((step, idx) => {
              const isDone    = doneSteps.has(idx);
              const isActive  = activeStep === idx && !isDone;
              const isPending = idx > activeStep;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 transition-opacity duration-500
                              ${isPending ? 'opacity-30' : 'opacity-100'}`}
                >
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {isDone   && <CheckCircleIcon className="text-emerald-400" />}
                    {isActive && <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />}
                    {isPending && <DotIcon className="text-gray-600" />}
                  </div>
                  <span
                    className={`text-sm transition-colors duration-300
                                ${isDone    ? 'text-emerald-400'          : ''}
                                ${isActive  ? 'text-gray-100 font-medium' : ''}
                                ${isPending ? 'text-gray-500'             : ''}`}
                  >
                    {isDone ? stepDoneLabel(idx) : step.active}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {animDone && !backendDone && (
            <p className="text-center text-xs text-gray-600 mt-4 animate-pulse">
              Still processing — this can take a moment…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Small shared components
// ─────────────────────────────────────────────────────────────────────────

function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-amber-500 text-3xl select-none">{'▶︎'}</span>
        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-xl">✕</span>
        </div>
        <h2 className="text-lg font-bold text-gray-200 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm
                     font-medium rounded-lg transition-colors border border-gray-700"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function CheckCircleIcon({ className = '' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function DotIcon({ className = '' }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" className={className}>
      <circle cx="4" cy="4" r="3" fill="currentColor" />
    </svg>
  );
}
