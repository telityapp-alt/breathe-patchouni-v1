import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../store/AppContext';

export function useBluetoothInhaler() {
  const { addInhalerLog } = useAppContext();
  const lastLogTime = useRef<number>(0);
  const [notification, setNotification] = useState<{ show: boolean, time: number }>({ show: false, time: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent triggering if user is actively typing in an input
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
        try { e.preventDefault(); } catch(err) {}

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
            notes: 'Automatic everything bypass logged via Bluetooth Clicker.'
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
      handleKeyDown({ key: 'VolumeUp', preventDefault: () => {}, target: document.body } as any);
    };

    // 1. Keyboard Events
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    
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
       window.removeEventListener('keydown', handleKeyDown, { capture: true });
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
