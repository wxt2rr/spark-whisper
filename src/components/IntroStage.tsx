import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MailOpen, Sparkles } from 'lucide-react';
import { initAudio, playExplosion } from '../utils/sound';

interface IntroStageProps {
  onComplete: () => void;
}

export function IntroStage({ onComplete }: IntroStageProps) {
  const [phase, setPhase] = useState<'sealed' | 'unsealed' | 'launching' | 'done'>('sealed');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [launchKey, setLaunchKey] = useState(0);
  const holdStartMsRef = useRef<number | null>(null);
  const holdRafRef = useRef<number | null>(null);

  const holdDurationMs = 900;
  const sealCircumference = useMemo(() => 2 * Math.PI * 18, []);
  const sealDashOffset = useMemo(
    () => sealCircumference * (1 - Math.min(1, Math.max(0, holdProgress))),
    [holdProgress, sealCircumference]
  );

  const handleExplosion = useCallback(() => {
    setPhase('done');
    playExplosion();
    window.setTimeout(onComplete, 140);
  }, [onComplete]);

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
        setPhase('launching');
        setLaunchKey(k => k + 1);
        window.setTimeout(handleExplosion, 520);
        return;
      }
      holdRafRef.current = window.requestAnimationFrame(tick);
    };

    holdRafRef.current = window.requestAnimationFrame(tick);
  }, [handleExplosion, holdDurationMs, stopHoldLoop]);

  useEffect(() => {
    return () => stopHoldLoop();
  }, [stopHoldLoop]);

  const ensureAudio = useCallback(() => {
    if (hasInteracted) return;
    setHasInteracted(true);
    initAudio();
  }, [hasInteracted]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-black text-white select-none">
      <div className="absolute inset-0 opacity-90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(167,139,250,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.05),transparent_55%)]" />
      </div>

      {phase !== 'done' && (
        <div className="relative z-10 w-[320px] sm:w-[380px]">
          <div className="text-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-sm text-white/60 tracking-wide"
            >
              时光邮局 · 特快件
            </motion.div>
            <div className="mt-2 text-3xl sm:text-4xl font-semibold tracking-widest text-white/90">
              2025
            </div>
          </div>

          <div className="relative h-[230px] sm:h-[260px]">
            <motion.div
              animate={phase === 'launching' ? { scale: 0.98, filter: 'blur(1px)', opacity: 0.6 } : { scale: 1, filter: 'blur(0px)', opacity: 1 }}
              transition={{ type: 'spring', damping: 18, stiffness: 180 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.65)]" />

              <div className="absolute left-6 right-6 top-6 flex items-center justify-between text-xs text-white/55">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-yellow-300/90" />
                  <span>FROM · 未来</span>
                </div>
              </div>

              <div className="absolute left-6 right-6 top-14 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <div className="text-[11px] text-white/45">To</div>
                <div className="mt-1 text-lg tracking-wide text-white/85">你</div>
                <div className="mt-2 h-px bg-white/10" />
                <div className="mt-2 text-[12px] text-white/55 leading-relaxed">
                  这是一封不需要回复的信。只要打开，烟花就会替你把话说出去。
                </div>
              </div>

              <motion.div
                initial={false}
                animate={phase === 'unsealed' || phase === 'launching' ? { rotateX: 160, y: -6 } : { rotateX: 0, y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 140 }}
                style={{ transformOrigin: 'top center', clipPath: 'polygon(0 0, 100% 0, 50% 65%)' }}
                className="absolute top-0 left-0 right-0 h-[140px] rounded-t-3xl bg-gradient-to-b from-white/10 to-white/0"
              />

              <div
                style={{ clipPath: 'polygon(0 100%, 50% 35%, 100% 100%)' }}
                className="absolute bottom-0 left-0 right-0 h-[140px] bg-gradient-to-t from-white/8 to-white/0"
              />

              <div className="absolute left-0 top-[84px] bottom-[30px] w-[52%] bg-white/5" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
              <div className="absolute right-0 top-[84px] bottom-[30px] w-[52%] bg-white/6" style={{ clipPath: 'polygon(100% 0, 0 50%, 100% 100%)' }} />

              <AnimatePresence>
                {phase === 'sealed' && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 240 }}
                    className="absolute left-1/2 top-[158px] -translate-x-1/2 w-[92px] h-[92px] rounded-full bg-gradient-to-b from-yellow-300/25 to-orange-500/15 border border-yellow-200/25 shadow-[0_12px_30px_rgba(250,204,21,0.15)] active:scale-[0.98]"
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
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MailOpen size={22} className="text-yellow-100/90" />
                    </div>
                    <svg className="absolute inset-0" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,0.10)" strokeWidth="3" fill="none" />
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        stroke="rgba(250,204,21,0.85)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={sealCircumference}
                        strokeDashoffset={sealDashOffset}
                        transform="rotate(-90 22 22)"
                      />
                    </svg>
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs text-white/55 whitespace-nowrap">
                      长按解封 · 自动放飞
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {phase === 'launching' && (
                  <motion.div
                    key={launchKey}
                    initial={{ y: 34, opacity: 0, scale: 0.98 }}
                    animate={{ y: -240, opacity: 0, scale: 0.92, filter: 'blur(6px)' }}
                    transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-1/2 top-[74px] -translate-x-1/2 w-[86%]"
                  >
                    <div className="rounded-2xl bg-gradient-to-b from-white/12 to-white/6 border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
                      <div className="px-5 py-5">
                        <div className="text-xs text-white/55 tracking-wide">已启封</div>
                        <div className="mt-2 text-xl font-semibold text-white/90 tracking-wide">一份祝福</div>
                        <div className="mt-3 text-sm text-white/65 leading-relaxed">正在放飞到夜空…</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {phase === 'launching' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.55, times: [0, 0.2, 1] }}
                  className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_50%_60%,rgba(250,204,21,0.35),transparent_60%)]"
                />
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 text-center text-xs text-white/35 leading-relaxed">
            你打开的不是信，是一场烟花。
          </div>
        </div>
      )}
    </div>
  );
}
