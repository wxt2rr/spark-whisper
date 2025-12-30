import { useCallback, useEffect, useRef } from 'react';
import { ConfigPayload } from '../types';

interface FireworkStageProps {
  payload: ConfigPayload;
}

export function FireworkStage({ payload }: FireworkStageProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const postToSim = useCallback((message: unknown) => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) return;
    targetWindow.postMessage(message, window.location.origin);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      postToSim({
        type: 'SW_INIT',
        paused: false,
        soundEnabled: true,
        config: {
          quality: '3',
          shell: 'Random',
          size: '3',
          wordShell: false,
          autoLaunch: true,
          finale: true,
          skyLighting: '2',
          hideControls: true,
          longExposure: false,
          scaleFactor: '1.00',
        },
      });
    };

    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [postToSim]);

  useEffect(() => {
    if (!payload.items.length) return;
    let index = 0;

    const fireOnce = () => {
      const item = payload.items[index];
      postToSim({
        type: 'SW_LAUNCH_WORD',
        text: item.content,
        x: 0.5,
        height: 0.6,
      });
      index = (index + 1) % payload.items.length;
    };

    fireOnce();
    const interval = window.setInterval(fireOnce, 9000);
    return () => window.clearInterval(interval);
  }, [payload, postToSim]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      postToSim({
        type: 'SW_LAUNCH',
        x: 0.12 + Math.random() * 0.76,
        height: 0.45 + Math.random() * 0.45,
        size: 2 + Math.floor(Math.random() * 2),
      });
    }, 700);
    return () => window.clearInterval(interval);
  }, [postToSim]);

  return (
    <div
      className="relative w-full h-full bg-black"
      onPointerDown={() => postToSim({ type: 'SW_SOUND', enabled: true })}
    >
      <iframe
        ref={iframeRef}
        title="Firework Simulator"
        src="/firework-simulator/index.html?embed=1"
        className="absolute inset-0 w-full h-full border-0"
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
