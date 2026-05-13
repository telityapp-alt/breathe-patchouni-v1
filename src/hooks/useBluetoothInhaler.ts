import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../store/AppContext';

export function useBluetoothInhaler() {
  const { addInhalerLog } = useAppContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const isInitialized = useRef(false);
  const [notification, setNotification] = useState<{ show: boolean, time: number }>({ show: false, time: 0 });

  const triggerLog = () => {
    if (debounceRef.current) return;
    
    const now = Date.now();
    addInhalerLog({
      timestamp: new Date().toISOString(),
      variantUsed: 'automatic-bypass',
      context: ['Automatic Trigger'],
      intensityBefore: 5,
      intensityAfter: 5,
      isInhalerAvailable: true,
      fallbackMethod: null,
      notes: 'Automatic everything bypass logged via Bluetooth Clicker / Volume.'
    }).then(() => {
      console.log('Bluetooth Inhaler trigger detected! Logged successfully.');
      setNotification({ show: true, time: now });
    }).catch(console.error);

    if (typeof window !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([100, 50, 100]); } catch(e){}
    }

    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
    }, 2000);
  };

  const initAudioAndMediaSession = () => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.001; 
      }

      const mediaSource = ctx.createMediaStreamDestination();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(mediaSource);
      source.start();

      const audio = new Audio();
      audio.srcObject = mediaSource.stream;
      audio.volume = 0.001; 
      audio.loop = true;
      audio.play().then(() => {
        audioRef.current = audio;
        setupMediaSession();
      }).catch(console.error);
    } catch (e) {
      console.error('Audio setup failed:', e);
    }
  };

  const setupMediaSession = () => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Breathe AI Active',
      artist: 'Inhaler Tracker',
    });
    navigator.mediaSession.playbackState = 'playing';

    try {
      navigator.mediaSession.setActionHandler('previoustrack', triggerLog);
      navigator.mediaSession.setActionHandler('nexttrack', triggerLog);
      navigator.mediaSession.setActionHandler('pause', triggerLog);
      navigator.mediaSession.setActionHandler('play', triggerLog);
    } catch (e) {
      console.warn('MediaSession action not supported:', e);
    }
  };

  useEffect(() => {
    const handleFirstInteraction = () => {
      initAudioAndMediaSession();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('previoustrack', null);
          navigator.mediaSession.setActionHandler('nexttrack', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('play', null);
        } catch(e) {}
      }
    };
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (notification.show) {
      timeout = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 4000);
    }
    return () => clearTimeout(timeout);
  }, [notification]);

  return { notification: notification.show };
}
