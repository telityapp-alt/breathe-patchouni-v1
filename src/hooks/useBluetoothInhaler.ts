import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../store/AppContext';

export function useBluetoothInhaler() {
  const { addInhalerLog } = useAppContext();
  const lastLogTime = useRef<number>(0);
  const [notification, setNotification] = useState<{ show: boolean, time: number }>({ show: false, time: 0 });

  useEffect(() => {
    // 1. Setup Silent Audio explicitly to capture Mobile Volume buttons
    let audio: HTMLAudioElement | null = null;
    
    const setupAudio = () => {
       if (!audio) {
          // A tiny 1-second silent WAV base64
          const silentWav = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
          audio = new Audio(silentWav);
          audio.loop = true;
          audio.play().catch(() => {}); // Catch autoplay errors
       }
    };
    
    // Start audio on first user interaction to satisfy browser autoplay policies
    const triggerAudio = () => {
       setupAudio();
       window.removeEventListener('click', triggerAudio, { capture: true });
       window.removeEventListener('touchstart', triggerAudio, { capture: true });
       window.removeEventListener('keydown', triggerAudio, { capture: true });
    };
    
    window.addEventListener('click', triggerAudio, { capture: true });
    window.addEventListener('touchstart', triggerAudio, { capture: true });
    window.addEventListener('keydown', triggerAudio, { capture: true });


    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }
      
      const key = e.key?.toLowerCase();
      // Broad support for triggers: volume buttons, media buttons, arrows, enter, space, plus, minus
      const isTriggerKey = [
        'audiovolumeup',
        'audiovolumedown',
        'volumeup',
        'volumedown',
        'mediatracknext',
        'mediatrackprevious',
        'mediaplaypause',
        'arrowup',
        'arrowdown',
        'enter',
        ' ',
        '+',
        '=',
        '-'
      ].includes(key);

      if (isTriggerKey) {
        // PREVENT default immediately to stop buttons from being clicked
        try { 
           e.preventDefault(); 
           e.stopPropagation();
        } catch(err) {}

        // Only log on keydown to prevent double triggering with keyup
        if (e.type !== 'keydown') return;

        const now = Date.now();
        // Debounce 2 seconds
        if (now - lastLogTime.current > 2000) { 
          lastLogTime.current = now;
          
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

          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
             try { navigator.vibrate([100, 50, 100]); } catch(e){}
          }
        }
      }
    };

    const triggerFromMediaSession = () => {
      // Simulate fake keydown
      handleKey({ type: 'keydown', key: 'VolumeUp', preventDefault: () => {}, stopPropagation: () => {}, target: document.body } as any);
    };

    // 1. Keyboard Events (Capture phase for all to suppress UI clicks)
    window.addEventListener('keydown', handleKey, { capture: true });
    window.addEventListener('keyup', handleKey, { capture: true });
    window.addEventListener('keypress', handleKey, { capture: true });
    
    // 2. Media Session Fallback (if clicker acts as media controller)
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', triggerFromMediaSession);
        navigator.mediaSession.setActionHandler('pause', triggerFromMediaSession);
        navigator.mediaSession.setActionHandler('nexttrack', triggerFromMediaSession);
        navigator.mediaSession.setActionHandler('previoustrack', triggerFromMediaSession);
      } catch(e) {}
    }

    return () => {
       window.removeEventListener('keydown', handleKey, { capture: true });
       window.removeEventListener('keyup', handleKey, { capture: true });
       window.removeEventListener('keypress', handleKey, { capture: true });
       window.removeEventListener('click', triggerAudio, { capture: true });
       window.removeEventListener('touchstart', triggerAudio, { capture: true });
       window.removeEventListener('keydown', triggerAudio, { capture: true });
       if (audio) {
          audio.pause();
          audio = null;
       }
       if ('mediaSession' in navigator) {
          try {
             navigator.mediaSession.setActionHandler('play', null);
             navigator.mediaSession.setActionHandler('pause', null);
             navigator.mediaSession.setActionHandler('nexttrack', null);
             navigator.mediaSession.setActionHandler('previoustrack', null);
          } catch(e) {}
       }
    };
  }, [addInhalerLog]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (notification.show) {
      timeout = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 4000); // hide after 4 seconds
    }
    return () => clearTimeout(timeout);
  }, [notification]);

  return { notification: notification.show };
}
