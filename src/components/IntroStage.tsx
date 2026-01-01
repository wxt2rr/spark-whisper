import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MailOpen, Sparkles } from 'lucide-react';
import { initAudio, playExplosion } from '../utils/sound';

interface IntroStageProps {
  onComplete: () => void;
  to?: string;
  from?: string;
  introMessage?: string;
  envelopeTitle?: string;
  envelopeYear?: string;
}

export function IntroStage({ 
  onComplete, 
  to = '你', 
  from = '未来',
  introMessage = '这是一封不需要回复的信。只要打开，烟花就会替你把话说出去。',
  envelopeTitle = '时光邮局 · 特快件',
  envelopeYear = String(new Date().getFullYear())
}: IntroStageProps) {
  const [phase, setPhase] = useState<'sealed' | 'unsealed' | 'launching' | 'done'>('sealed');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartMsRef = useRef<number | null>(null);
  const holdRafRef = useRef<number | null>(null);

  const holdDurationMs = 900;
  const foldYPct = 44;
  // const sealCircumference = useMemo(() => 2 * Math.PI * 18, []);
  // const sealDashOffset = useMemo(
  //   () => sealCircumference * (1 - Math.min(1, Math.max(0, holdProgress))),
  //   [holdProgress, sealCircumference]
  // );

  useEffect(() => {
    if (phase === 'unsealed') {
      const timer = setTimeout(() => {
        setPhase('done');
        playExplosion();
        setTimeout(onComplete, 140);
      }, 3500); // 0.6s flap + 0.8s slide + 2.1s wait
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const stopHoldLoop = useCallback(() => {
    if (holdRafRef.current) window.cancelAnimationFrame(holdRafRef.current);
    holdRafRef.current = null;
    holdStartMsRef.current = null;
  }, []);

  const startHoldLoop = useCallback(() => {
    stopHoldLoop();
    holdStartMsRef.current = performance.now();

    const tick = () => {
      if (holdStartMsRef.current == null) return;
      const elapsed = performance.now() - holdStartMsRef.current;
      const next = Math.min(1, elapsed / holdDurationMs);
      setHoldProgress(next);
      if (next >= 1) {
        stopHoldLoop();
        setPhase('unsealed');
        return;
      }
      holdRafRef.current = window.requestAnimationFrame(tick);
    };

    holdRafRef.current = window.requestAnimationFrame(tick);
  }, [holdDurationMs, stopHoldLoop]);

  useEffect(() => {
    return () => stopHoldLoop();
  }, [stopHoldLoop]);

  const ensureAudio = useCallback(() => {
    if (hasInteracted) return;
    setHasInteracted(true);
    initAudio();
  }, [hasInteracted]);

  const showHint = phase === 'sealed' && (holdProgress <= 0 || holdProgress >= 1);
  const showEnvelopeTitle = envelopeTitle.trim().length > 0;
  const showEnvelopeYear = envelopeYear.trim().length > 0;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-black text-white select-none">
      <motion.div
        className="absolute inset-0 z-0"
        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 opacity-90">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(167,139,250,0.16),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.05),transparent_55%)]" />
        </div>
      </motion.div>

      {phase !== 'done' && (
        <motion.div 
           className="relative z-10 w-[320px] sm:w-[380px]"
           exit={{ opacity: 0, y: -40, scale: 0.95, filter: 'blur(4px)' }}
           transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="text-center mb-8">
            {showEnvelopeTitle && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center gap-3 text-sm text-amber-200/60 tracking-widest font-medium uppercase"
              >
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-amber-200/40" />
                {envelopeTitle}
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-amber-200/40" />
              </motion.div>
            )}
            {showEnvelopeYear && (
              <div className="mt-2 text-5xl sm:text-6xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-200 to-amber-600 drop-shadow-[0_2px_10px_rgba(251,191,36,0.2)] font-serif" style={{ fontFamily: 'Times New Roman, serif' }}>
                {envelopeYear}
              </div>
            )}
          </div>

          <div className="relative h-[230px] sm:h-[260px]">
            <motion.div
              animate={phase === 'unsealed' ? { scale: 1, filter: 'blur(0px)', opacity: 1 } : { scale: 1, filter: 'blur(0px)', opacity: 1 }}
              transition={{ type: 'spring', damping: 18, stiffness: 180 }}
              className="absolute inset-0"
            >
              {/* Envelope Body - Dark Premium Cardstock */}
              <div className="absolute inset-0 rounded-xl bg-[#1c1c1c] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_30px_60px_-12px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)]" />
              
              {/* Paper Texture Overlay (Noise) */}
              <div className="absolute inset-0 rounded-xl opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

              {/* Letter Card (Inside) - Starts hidden lower */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={phase === 'unsealed' ? { y: -160, opacity: 1 } : { y: 20, opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-4 right-4 top-4 h-[200px] rounded-lg bg-[#fcfcfc] shadow-lg z-10 p-5 flex flex-col"
              >
                  <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-3 border-b border-neutral-100 pb-2">
                    A Letter from {from}
                  </div>
                  <div className="text-sm text-neutral-800 leading-relaxed font-serif tracking-wide italic opacity-90 flex-1">
                    {introMessage}
                  </div>
                  <div className="mt-auto flex justify-end">
                      <div className="w-16 h-16 opacity-10 bg-[url('https://api.iconify.design/mdi:postage-stamp.svg')] bg-no-repeat bg-contain" />
                  </div>
              </motion.div>

              {/* Side Flaps (Front Layer 1) */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1/2 bg-[#1f1f1f] z-20 shadow-[-1px_0_1px_rgba(255,255,255,0.05)]"
                style={{ clipPath: `polygon(0 0, 100% ${foldYPct}%, 0 100%)` }}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#1a1a1a] z-20 shadow-[1px_0_1px_rgba(255,255,255,0.05)]"
                style={{ clipPath: `polygon(100% 0, 0 ${foldYPct}%, 100% 100%)` }}
              />

              {/* Bottom Flap (Front Layer 2) */}
              <div
                style={{ clipPath: `polygon(0 100%, 50% ${foldYPct}%, 100% 100%)` }}
                className="absolute inset-0 bg-gradient-to-t from-[#252525] to-[#1e1e1e] z-20 shadow-[0_-1px_1px_rgba(0,0,0,0.5)]"
              />

              {/* Address Label (On top of Bottom Flap) */}
              <div className="absolute left-0 right-0 bottom-2 z-20 flex flex-col items-center justify-center pointer-events-none">
                 <div className="flex flex-col items-center gap-1 opacity-90">
                    <div className="text-[10px] text-amber-500/60 uppercase tracking-[0.2em] font-bold">To</div>
                    <div className="text-2xl tracking-wide text-amber-50 font-serif italic drop-shadow-md">{to}</div>
                 </div>
                 <div className="mt-3 flex items-center gap-2 text-[9px] text-white/20 tracking-widest uppercase">
                    <Sparkles size={9} />
                    <span>From · {from}</span>
                 </div>
              </div>

              {/* Top Flap */}
              <motion.div
                initial={false}
                animate={phase === 'unsealed' ? { rotateX: 180, zIndex: 1 } : { rotateX: 0, zIndex: 30 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ transformOrigin: 'top center', clipPath: `polygon(0 0, 100% 0, 50% ${foldYPct}%)` }}
                className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] to-[#222] shadow-[0_5px_15px_rgba(0,0,0,0.5)] border-t border-white/10"
              >
                 <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50" />
              </motion.div>

              <AnimatePresence>
                {phase === 'sealed' && (
                  <div
                    className="absolute z-40"
                    style={{ left: '50%', top: `${foldYPct}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <motion.div
                      initial={false}
                      animate={showHint ? { opacity: 1, scale: [0.98, 1.04, 0.98] } : { opacity: 0, scale: 0.98 }}
                      transition={{ duration: 1.6, repeat: showHint ? Infinity : 0, ease: 'easeInOut' }}
                      className="absolute inset-[-14px] rounded-full border border-amber-200/25 shadow-[0_0_30px_rgba(251,191,36,0.12)]"
                    />
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ type: 'spring', damping: 18, stiffness: 240 }}
                      className="w-[92px] h-[92px] rounded-full group"
                      onPointerDown={(e) => {
                        ensureAudio();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        startHoldLoop();
                      }}
                      onPointerUp={(e) => {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                        stopHoldLoop();
                        setHoldProgress(p => (p >= 1 ? p : 0));
                      }}
                      onPointerCancel={() => {
                        stopHoldLoop();
                        setHoldProgress(0);
                      }}
                      aria-label="长按解封"
                    >
                      {/* Wax Seal Body */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-800 shadow-[0_6px_16px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.4)] border border-amber-500/30 active:scale-[0.98] transition-transform duration-200">
                        <div className="absolute inset-2 rounded-full border border-amber-800/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]" />
                      </div>

                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-95">
                        <div className="drop-shadow-[0_1px_0_rgba(255,255,255,0.2)]">
                          <MailOpen size={22} className="text-amber-900" strokeWidth={2.5} />
                        </div>
                        <motion.div
                          initial={false}
                          animate={showHint ? { opacity: [0.55, 1, 0.55], y: [0, -1, 0] } : { opacity: 0.35, y: 0 }}
                          transition={{ duration: 1.4, repeat: showHint ? Infinity : 0, ease: 'easeInOut' }}
                          className="text-[11px] font-semibold tracking-[0.22em] text-amber-950/90 select-none"
                        >
                          长按解封
                        </motion.div>
                      </div>

                      {/* Progress Circle Overlay */}
                      <svg className="absolute inset-[-4px]" viewBox="0 0 44 44">
                        <circle
                          cx="22"
                          cy="22"
                          r="20"
                          stroke="rgba(251,191,36,0.9)"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 20}
                          strokeDashoffset={2 * Math.PI * 20 * (1 - Math.min(1, Math.max(0, holdProgress)))}
                          transform="rotate(-90 22 22)"
                          className="drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                        />
                      </svg>
                    </motion.button>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>


        </motion.div>
      )}
    </div>
  );
}
