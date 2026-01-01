import { useState } from 'react';
import { ConfigPayload } from '../types';
import { IntroStage } from './IntroStage';
import { FireworkStage } from './FireworkStage';
import { X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

interface ViewerProps {
  payload: ConfigPayload;
  onExit: () => void;
}

export function Viewer({ payload, onExit }: ViewerProps) {
  const [stage, setStage] = useState<'intro' | 'show'>('intro');

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <button 
        onClick={onExit}
        className="absolute top-4 right-4 z-[100] text-white/50 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-sm"
      >
        <X size={24} />
      </button>

      <AnimatePresence mode="wait">
        {stage === 'intro' ? (
          <IntroStage 
            key="intro"
            onComplete={() => setStage('show')} 
            to={payload.to}
            from={payload.from}
            introMessage={payload.introMessage}
            envelopeTitle={payload.envelopeTitle}
            envelopeYear={payload.envelopeYear}
          />
        ) : (
          <FireworkStage key="firework" payload={payload} />
        )}
      </AnimatePresence>
    </div>
  );
}
