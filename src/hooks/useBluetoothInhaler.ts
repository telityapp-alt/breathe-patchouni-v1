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
    const handleFirstInteraction = () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      console.log('[BT Inhaler] First interaction detected, initializing audio...');

      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();

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

        audio
          .play()
          .then(() => {
            audioRef.current = audio;
            console.log('[BT Inhaler] Audio playing, setting up MediaSession...');

            if (!('mediaSession' in navigator)) {
              console.warn('[BT Inhaler] MediaSession not supported on this browser.');
              return;
            }

            navigator.mediaSession.metadata = new MediaMetadata({
              title: 'Breathe AI Active',
              artist: 'Inhaler Tracker',
            });
            navigator.mediaSession.playbackState = 'playing';

            // Pakai wrapper ke ref — ini fix stale closure di MediaSession handler
            const handler = () => triggerLogRef.current();

            try { navigator.mediaSession.setActionHandler('previoustrack', handler); } catch (e) {}
            try { navigator.mediaSession.setActionHandler('nexttrack', handler); } catch (e) {}
            try { navigator.mediaSession.setActionHandler('pause', handler); } catch (e) {}
            try { navigator.mediaSession.setActionHandler('play', handler); } catch (e) {}

            console.log('[BT Inhaler] MediaSession handlers registered.');
          })
          .catch((e) => console.error('[BT Inhaler] Audio play failed:', e));
      } catch (e) {
        console.error('[BT Inhaler] Audio context setup error:', e);
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
