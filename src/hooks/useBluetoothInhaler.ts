import { useEffect, useRef, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppContext } from '../store/AppContext';

export function useBluetoothInhaler() {
  const { addInhalerLog } = useAppContext();
  const addInhalerLogRef = useRef(addInhalerLog);
  const debounceRef = useRef<number | null>(null);
  const [notification, setNotification] = useState<{ show: boolean; time: number }>({
    show: false, time: 0,
  });

  useEffect(() => { addInhalerLogRef.current = addInhalerLog; }, [addInhalerLog]);

  const triggerLog = useCallback(() => {
    if (debounceRef.current) return;

    const now = Date.now();
    addInhalerLogRef.current({
      timestamp: new Date().toISOString(),
      variantUsed: 'automatic-bypass',
      context: ['Auto (Physical Button)'],
      intensityBefore: 5,
      intensityAfter: null,
      isInhalerAvailable: true,
      fallbackMethod: null,
      notes: 'Auto-logged via hardware volume button.',
    }).then(() => {
      setNotification({ show: true, time: now });
      navigator.vibrate?.([100, 50, 100]);
      console.log('[BT Inhaler] Logged successfully.');
    }).catch(console.error);

    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
    }, 2000);
  }, []);

  const triggerLogRef = useRef(triggerLog);
  useEffect(() => { triggerLogRef.current = triggerLog; }, [triggerLog]);

  useEffect(() => {
    // Cek apakah running di native Capacitor (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      console.warn('[BT Inhaler] Not native platform — volume button detection unavailable in browser.');
      return;
    }

    const startListening = async () => {
      try {
        const { VolumeButtons } = await import('@capacitor-community/volume-buttons');

        await VolumeButtons.watchVolume(
          { suppressVolumeIndicator: true }, // Android: suppress OS volume UI
          (result: { direction: 'up' | 'down' }, err?: any) => {
            if (err) { console.error('[BT Inhaler] Volume error:', err); return; }
            console.log('[BT Inhaler] Volume button pressed:', result.direction);
            triggerLogRef.current();
          }
        );

        console.log('[BT Inhaler] Volume button listener active.');
      } catch (e) {
        console.error('[BT Inhaler] Failed to start volume listener:', e);
      }
    };

    startListening();

    return () => {
      import('@capacitor-community/volume-buttons').then(({ VolumeButtons }) => {
        VolumeButtons.clearWatch();
      });
    };
  }, []);

  useEffect(() => {
    if (!notification.show) return;
    const t = setTimeout(() => setNotification(p => ({ ...p, show: false })), 4000);
    return () => clearTimeout(t);
  }, [notification.show]);

  return { notification: notification.show };
}
