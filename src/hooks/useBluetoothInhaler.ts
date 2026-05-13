import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext } from '../store/AppContext';

export function useBluetoothInhaler() {
  const { addInhalerLog } = useAppContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const debounceRef = useRef<number | null>(null);
  const isInitialized = useRef(false);
  const addInhalerLogRef = useRef(addInhalerLog);
  const [notification, setNotification] = useState<{ show: boolean; time: number }>({
    show: false,
    time: 0,
  });

  // Selalu sync ref ke latest version
  useEffect(() => {
    addInhalerLogRef.current = addInhalerLog;
  }, [addInhalerLog]);

  const triggerLog = useCallback(() => {
    if (debounceRef.current) {
      console.log('[BT Inhaler] Debounced, skipping.');
      return;
    }

    console.log('[BT Inhaler] TRIGGERED — logging now...');

    const now = Date.now();

    // Pakai ref, bukan closure langsung — ini fix stale closure
    addInhalerLogRef.current({
      timestamp: new Date().toISOString(),
      variantUsed: 'automatic-bypass',
      context: ['Automatic Trigger'],
      intensityBefore: 5,
      intensityAfter: 5,
      isInhalerAvailable: true,
      fallbackMethod: null,
      notes: 'Auto-logged via Bluetooth / Volume Button.',
    })
      .then(() => {
        console.log('[BT Inhaler] Log success!');
        setNotification({ show: true, time: now });
        navigator.vibrate?.([100, 50, 100]);
      })
      .catch((e) => console.error('[BT Inhaler] Log failed:', e));

    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
    }, 2000);
  }, []); // empty deps — aman karena pakai ref

  const triggerLogRef = useRef(triggerLog);
  useEffect(() => {
    triggerLogRef.current = triggerLog;
  }, [triggerLog]);

  useEffect(() => {
    // STEP 1: Pre-create AudioContext IMMEDIATELY on mount (suspended state — OK)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
      console.log('[BT Inhaler] AudioContext pre-created, state:', audioCtxRef.current.state);
    } catch (e) {
      console.error('[BT Inhaler] Cannot create AudioContext:', e);
    }

    // STEP 2: Unlock pattern
    const unlock = async (e: Event) => {
      if (isInitialized.current) return;

      const ctx = audioCtxRef.current;
      if (!ctx) return;

      console.log('[BT Inhaler] Unlock attempt, ctx state:', ctx.state);

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      console.log('[BT Inhaler] ctx state after resume:', ctx.state);

      if (ctx.state !== 'running') {
        console.warn('[BT Inhaler] ctx still not running, will retry next gesture.');
        return;
      }

      isInitialized.current = true;

      try {
        const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = (Math.random() * 2 - 1) * 0.001;
        }

        const dest = ctx.createMediaStreamDestination();
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.connect(dest);
        src.start();

        const audio = new Audio();
        audio.srcObject = dest.stream;
        audio.volume = 0.001;
        audio.loop = true;

        await audio.play();
        audioRef.current = audio;
        console.log('[BT Inhaler] Audio playing.');

        if (!('mediaSession' in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Breathe AI Active',
          artist: 'Inhaler Tracker',
        });
        navigator.mediaSession.playbackState = 'playing';

        const handler = () => triggerLogRef.current();

        try { navigator.mediaSession.setActionHandler('previoustrack', handler); } catch (_) {}
        try { navigator.mediaSession.setActionHandler('nexttrack', handler); } catch (_) {}
        try { navigator.mediaSession.setActionHandler('pause', handler); } catch (_) {}
        try { navigator.mediaSession.setActionHandler('play', handler); } catch (_) {}

        console.log('[BT Inhaler] MediaSession handlers registered. Ready.');

        document.body.removeEventListener('touchstart', unlock);
        document.body.removeEventListener('mousedown', unlock);
        document.body.removeEventListener('keydown', unlock);

      } catch (err) {
        console.error('[BT Inhaler] Setup failed:', err);
        isInitialized.current = false;
      }
    };

    document.body.addEventListener('touchstart', unlock, false);
    document.body.addEventListener('mousedown', unlock, false);
    document.body.addEventListener('keydown', unlock, false);

    return () => {
      document.body.removeEventListener('touchstart', unlock);
      document.body.removeEventListener('mousedown', unlock);
      document.body.removeEventListener('keydown', unlock);
      audioRef.current?.pause();
      audioRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      if ('mediaSession' in navigator) {
        try { navigator.mediaSession.setActionHandler('previoustrack', null); } catch (e) {}
        try { navigator.mediaSession.setActionHandler('nexttrack', null); } catch (e) {}
        try { navigator.mediaSession.setActionHandler('pause', null); } catch (e) {}
        try { navigator.mediaSession.setActionHandler('play', null); } catch (e) {}
      }
    };
  }, []); // sengaja empty — audio init hanya sekali

  // Auto-hide notification
  useEffect(() => {
    if (!notification.show) return;
    const t = setTimeout(() => setNotification((p) => ({ ...p, show: false })), 4000);
    return () => clearTimeout(t);
  }, [notification.show]);

  return { notification: notification.show };
}
