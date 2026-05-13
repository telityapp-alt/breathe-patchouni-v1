import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../store/AppContext';

/**
 * Hook to intercept volume button presses (often sent by Bluetooth shutters/clickers)
 * and automatically log an inhaler usage.
 */
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
      // Most bluetooth shutters send VolumeUp/AudioVolumeUp
      const isVolumeKey = [
        'audiovolumeup',
        'audiovolumedown',
        'volumeup',
        'volumedown',
        'mediatracknext',
        'mediaplaypause'
      ].includes(key);

      if (isVolumeKey) {
        // Try/catch just in case.
        try {
           // Do not universally preventDefault on volume keys, some OS might hate it, but try for web
        } catch(err){}

        const now = Date.now();
        // Debounce to prevent double-logging if device stutters or sends multiple events
        if (now - lastLogTime.current > 2000) { 
          lastLogTime.current = now;
          
          // Automatic everything bypass
          addInhalerLog({
            timestamp: new Date().toISOString(),
            variantUsed: 'automatic_bypass',
            cravingContexts: ['Automatic'],
            intensityBefore: 5,
            intensityAfter: 5,
            notes: 'Automatic everything bypass.'
          });
          
          console.log('Bluetooth Inhaler trigger detected! Automatic everything bypass.');
          
          setNotification({ show: true, time: now });

          // Provide haptic feedback if the device supports it
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]); // Two quick buzzes
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addInhalerLog]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (notification.show) {
      timeout = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3500); // hide after 3.5 seconds
    }
    return () => clearTimeout(timeout);
  }, [notification]);

  return { notification: notification.show };
}
