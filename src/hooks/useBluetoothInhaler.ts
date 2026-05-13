import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../store/AppContext';

/**
 * Hook to intercept volume button presses (often sent by Bluetooth shutters/clickers)
 * and automatically log an inhaler usage.
 * 
 * Works best when the web app is in the foreground and focused.
 */
export function useBluetoothInhaler() {
  const { addInhalerLog } = useAppContext();
  const lastLogTime = useRef<number>(0);
  const [notification, setNotification] = useState<{ show: boolean, time: number }>({ show: false, time: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Many Bluetooth camera shutters send "VolumeUp", "AudioVolumeUp", or even "Enter"
      const isVolumeKey = [
        'AudioVolumeUp',
        'AudioVolumeDown',
        'VolumeUp',
        'VolumeDown',
        'MediaTrackNext',
        'MediaPlayPause'
      ].includes(e.key);

      // If you are using a generic clicker that sends "Enter" or Space, be careful as it 
      // might interfere with form inputs, hence focusing specifically on Media/Volume keys.

      if (isVolumeKey) {
        // Optionally try to prevent system volume change UI from showing
        // Note: Mobile browsers often restrict preventing volume default behaviors.
        // Try/catch just in case.
        try {
           // We do not preventDefault here so it doesn't break OS-level media stuff completely if unsupported.
        } catch(err){}

        const now = Date.now();
        // Debounce to prevent double-logging if device stutters or sends multiple events
        if (now - lastLogTime.current > 2000) { 
          lastLogTime.current = now;
          
          addInhalerLog({
            timestamp: new Date().toISOString(),
            variantUsed: 'cool_mint', // Automatically assigned for smart inhaler
            notes: 'Auto-logged via Breathe AI Smart Inhaler (Bluetooth)'
          });
          
          console.log('Bluetooth Inhaler trigger detected! Logged successfully.');
          
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
      }, 3000); // hide after 3 seconds
    }
    return () => clearTimeout(timeout);
  }, [notification]);

  return { notification: notification.show };
}
