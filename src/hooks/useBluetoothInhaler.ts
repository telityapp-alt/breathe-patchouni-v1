import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext } from '../store/AppContext';

export function useBluetoothInhaler() {
  const { addInhalerLog } = useAppContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const isInitialized = useRef(false);
  const addInhalerLogRef = useRef(addInhalerLog); // <-- KEY FIX
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
    const handleFirstInteraction = async (e: Event) => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);

      console.log('[BT Inhaler] First interaction detected, initializing audio...');

      try {
        // KUNCI: AudioContext dibuat SYNCHRONOUS di sini, dalam callstack gesture yang sama
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();

        // Resume explicitly — wajib di Chrome mobile
        await ctx.resume();
        console.log('[BT Inhaler] AudioContext state:', ctx.state);

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

        // play() dipanggil masih dalam async function yang triggered by gesture
        await audio.play();
        audioRef.current = audio;
        console.log('[BT Inhaler] Audio playing, setting up MediaSession...');

        if (!('mediaSession' in navigator)) {
          console.warn('[BT Inhaler] MediaSession not supported.');
          return;
        }

        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Breathe AI Active',
          artist: 'Inhaler Tracker',
        });
        navigator.mediaSession.playbackState = 'playing';

        const handler = () => triggerLogRef.current();

        try { navigator.mediaSession.setActionHandler('previoustrack', handler); } catch (e) {}
        try { navigator.mediaSession.setActionHandler('nexttrack', handler); } catch (e) {}
        try { navigator.mediaSession.setActionHandler('pause', handler); } catch (e) {}
        try { navigator.mediaSession.setActionHandler('play', handler); } catch (e) {}

        console.log('[BT Inhaler] MediaSession handlers registered.');

      } catch (e) {
        console.error('[BT Inhaler] Setup failed:', e);
        // Reset flag biar bisa retry di interaction berikutnya
        isInitialized.current = false;
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      audioRef.current?.pause();
      audioRef.current = null;
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
