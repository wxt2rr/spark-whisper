import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfigPayload } from '../types';

import myMathSrc from '../lib/firework_simulator/MyMath.js?raw';
import stageSrc from '../lib/firework_simulator/Stage.js?raw';
import fscreenSrc from '../lib/firework_simulator/fscreen.js?raw';
import simSrc from '../lib/firework_simulator/script.js?raw';

interface FireworkStageProps {
  payload: ConfigPayload;
}

export function FireworkStage({ payload }: FireworkStageProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isPausedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const postToSim = useCallback((message: unknown) => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) return;
    targetWindow.postMessage(message, '*');
  }, []);

  const srcDoc = useMemo(() => {
    const baseHref = `${window.location.origin}/`;
    const patchedSimSrc = simSrc
      .replace('baseURL: "./audio/",', 'baseURL: "audio/fireworks/",')
      .replace('lift: {\n\t\t\tvolume: 1,', 'lift: {\n\t\t\tvolume: 0,');

    const bridgeSrc = `
      (function () {
        function setConfigPatch(patch) {
          var storeRef = typeof store !== "undefined" ? store : null;
          if (!storeRef || !storeRef.state || !storeRef.setState) return;
          var config = storeRef.state.config || {};
          storeRef.setState({ config: Object.assign({}, config, patch) });
        }

        function clamp01(v) {
          if (v < 0) return 0;
          if (v > 1) return 1;
          return v;
        }

        function launchShell(opts) {
          var x = clamp01(typeof opts.x === "number" ? opts.x : 0.5);
          var height = clamp01(typeof opts.height === "number" ? opts.height : 0.55);
          var size = typeof opts.size === "number" ? opts.size : +((typeof store !== "undefined" && store.state && store.state.config && store.state.config.size) || 3);
          var shellName = typeof opts.shell === "string" ? opts.shell : null;

          var shellType = null;
          if (shellName && typeof shellTypes !== "undefined" && shellTypes[shellName]) {
            shellType = shellTypes[shellName];
          }

          var baseOpts = shellType ? shellType(size) : typeof shellFromConfig !== "undefined" ? shellFromConfig(size) : null;
          if (!baseOpts || typeof Shell === "undefined") return;
          var shell = new Shell(baseOpts);
          shell.launch(x, height);
        }

        function ensureWordDots(wordText) {
          if (!wordText) return;
          if (typeof wordDotsMap === "undefined") return;
          if (wordDotsMap[wordText]) return;
          if (typeof MyMath === "undefined" || !MyMath.literalLattice) return;
          var len = wordText.length;
          var fontPx = len <= 6 ? 140 : len <= 10 ? 120 : 100;
          wordDotsMap[wordText] = MyMath.literalLattice(wordText, 3, "Gabriola,华文琥珀", fontPx + "px");
        }

        function revealWordFromBurst(wordText, shell, cx, cy) {
          if (!wordText) return;
          if (typeof wordDotsMap === "undefined") return;
          var map = wordDotsMap[wordText];
          if (!map || !Array.isArray(map.points) || !map.points.length) return;
          if (typeof Star === "undefined") return;

          var dcenterX = map.width / 2;
          var dcenterY = map.height / 2;
          var shellColor = (typeof shell.color === "string" && shell.color !== "random") ? shell.color : (typeof COLOR !== "undefined" ? COLOR.Gold : "#ffbf36");

          var points = [];
          var rawPoints = map.points;
          var stride = rawPoints.length > 2600 ? 2 : 1;
          for (var i = 0; i < rawPoints.length; i += stride) {
            var p = rawPoints[i];
            var dx = p.x - dcenterX;
            var dy = p.y - dcenterY;
            points.push({ dx: dx, dy: dy, d: dx * dx + dy * dy });
          }
          points.sort(function (a, b) { return a.d - b.d; });

          var steps = 12;
          var chunkSize = Math.ceil(points.length / steps);
          var revealDelay = 100;
          var revealDuration = 800;
          var stepDelay = revealDuration / steps;

          for (var step = 0; step < steps; step++) {
            var start = step * chunkSize;
            if (start >= points.length) break;
            var end = Math.min(points.length, start + chunkSize);
            var slice = points.slice(start, end);
            setTimeout((function (sliceCopy) {
              return function () {
                for (var j = 0; j < sliceCopy.length; j++) {
                  var dx2 = sliceCopy[j].dx;
                  var dy2 = sliceCopy[j].dy;
                  var targetX = cx + dx2;
                  var targetY = cy + dy2;
                  var angle = Math.atan2(dx2, dy2) + (Math.random() - 0.5) * 0.2;
                  var speed = 0.05 + Math.random() * 0.15;
                  var life = 2200 + Math.random() * 800;
                  var star = Star.add(targetX, targetY, shellColor, angle, speed, life, 0, 0, 4);
                  star.heavy = false;
                  star.strobe = true;
                  star.strobeFreq = 30 + Math.random() * 20;
                  star.x = targetX + (Math.random() - 0.5) * 2;
                  star.y = targetY + (Math.random() - 0.5) * 2;
                  star.prevX = star.x - (Math.sin(angle) * speed * 1.5);
                  star.prevY = star.y - (Math.cos(angle) * speed * 1.5);
                }
              };
            })(slice), revealDelay + step * stepDelay);
          }
        }

        function launchWordShell(opts) {
          var text = typeof opts.text === "string" ? opts.text : "";
          if (!text) return;
          if (typeof Shell === "undefined" || typeof shellFromConfig === "undefined") return;
          if (typeof soundManager === "undefined" || typeof BurstFlash === "undefined") return;

          ensureWordDots(text);

          var x = clamp01(typeof opts.x === "number" ? opts.x : 0.5);
          var height = clamp01(typeof opts.height === "number" ? opts.height : 0.55);
          var size = typeof opts.size === "number" ? opts.size : +((typeof store !== "undefined" && store.state && store.state.config && store.state.config.size) || 3);

          var shell = new Shell(shellFromConfig(size));
          var originalBurst = shell.burst.bind(shell);

          shell.burst = function (cx, cy) {
            originalBurst(cx, cy);
            revealWordFromBurst(text, shell, cx, cy);
            shell.burst = originalBurst;
          };

          shell.launch(x, height);
        }

        function handleMessage(event) {
          if (event.source !== window.parent) return;
          var msg = event.data;
          if (!msg || typeof msg !== "object") return;
          if (msg.type === "SW_INIT") {
            var cfg = msg.config || {};
            if (cfg.hideControls) {
              var controls = document.querySelector(".controls");
              var menu = document.querySelector(".menu");
              var helpModal = document.querySelector(".help-modal");
              if (controls) controls.style.display = "none";
              if (menu) menu.style.display = "none";
              if (helpModal) helpModal.style.display = "none";
            }
            setConfigPatch(cfg);
            if (typeof msg.paused === "boolean" && typeof togglePause !== "undefined") {
              togglePause(msg.paused);
            }
            if (typeof msg.soundEnabled === "boolean" && typeof toggleSound !== "undefined") {
              toggleSound(msg.soundEnabled);
            }
            return;
          }
          if (msg.type === "SW_LAUNCH") {
            launchShell(msg);
            return;
          }
          if (msg.type === "SW_LAUNCH_WORD") {
            launchWordShell(msg);
            return;
          }
          if (msg.type === "SW_SOUND") {
            if (typeof msg.enabled === "boolean" && typeof toggleSound !== "undefined") {
              toggleSound(msg.enabled);
            }
            return;
          }
        }

        window.addEventListener("message", handleMessage);
      })();
    `;

    return `<!doctype html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
          <base href="${baseHref}" />
          <style>
            html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
            .container { position: relative; width: 100%; height: 100%; }
            .loading-init { display: none; }
            .stage-container { position: absolute; inset: 0; }
            .stage-container.remove { display: block; }
            .canvas-container { position: absolute; inset: 0; background: #000; }
            canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
            .controls, .menu, .help-modal { display: none !important; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="loading-init"><div class="loading-init__header">加载中</div><div class="loading-init__status">正在装配烟花</div></div>
            <div class="stage-container remove">
              <div class="canvas-container">
                <canvas id="trails-canvas"></canvas>
                <canvas id="main-canvas"></canvas>
              </div>
              <div class="controls">
                <div class="btn pause-btn"><svg><use href="#icon-play"></use></svg></div>
                <div class="btn sound-btn"><svg><use href="#icon-sound-on"></use></svg></div>
                <select class="shell-type"></select><div class="shell-type-label"></div>
                <select class="shell-size"></select><div class="shell-size-label"></div>
                <select class="quality-ui"></select><div class="quality-ui-label"></div>
                <select class="sky-lighting"></select><div class="sky-lighting-label"></div>
                <select class="scaleFactor"></select><div class="scaleFactor-label"></div>
                <input type="checkbox" class="word-shell" /><div class="word-shell-label"></div>
                <input type="checkbox" class="auto-launch" /><div class="auto-launch-label"></div>
                <div class="form-option--finale-mode"><input type="checkbox" class="finale-mode" /><div class="finale-mode-label"></div></div>
                <input type="checkbox" class="hide-controls" /><div class="hide-controls-label"></div>
                <div class="form-option--fullscreen"><input type="checkbox" class="fullscreen" /><div class="fullscreen-label"></div></div>
                <input type="checkbox" class="long-exposure" /><div class="long-exposure-label"></div>
              </div>
              <div class="menu"><div class="menu__inner-wrap"></div></div>
              <div class="help-modal"><div class="help-modal__overlay"></div><div class="help-modal__header"></div><div class="help-modal__body"></div><button class="help-modal__close-btn"></button></div>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" style="height:0;width:0;position:absolute;visibility:hidden">
            <symbol id="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></symbol>
            <symbol id="icon-pause" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></symbol>
            <symbol id="icon-sound-on" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></symbol>
            <symbol id="icon-sound-off" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></symbol>
          </svg>
          <script>${fscreenSrc}</script>
          <script>${myMathSrc}</script>
          <script>${stageSrc}</script>
          <script>${patchedSimSrc}</script>
          <script>${bridgeSrc}</script>
        </body>
      </html>`;
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
      setIsReady(true);
    };

    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [postToSim, srcDoc]);

  useEffect(() => {
    if (!isReady || !payload.items.length) return;
    let index = 0;

    const fireOnce = () => {
      // 暂停背景烟花，为文字展示腾出视觉空间
      isPausedRef.current = true;
      // 4秒后恢复背景烟花（文字展示大概持续3-4秒）
      setTimeout(() => {
        isPausedRef.current = false;
      }, 4200);

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
  }, [payload, postToSim, isReady]);

  useEffect(() => {
    if (!isReady) return;
    const interval = window.setInterval(() => {
      if (isPausedRef.current) return;
      
      postToSim({
        type: 'SW_LAUNCH',
        x: 0.12 + Math.random() * 0.76,
        height: 0.45 + Math.random() * 0.45,
        size: 2 + Math.floor(Math.random() * 2),
      });
    }, 700);
    return () => window.clearInterval(interval);
  }, [postToSim, isReady]);

  return (
    <div
      className="relative w-full h-full bg-black"
    >
      <iframe
        ref={iframeRef}
        title="Firework Simulator"
        srcDoc={srcDoc}
        className="absolute inset-0 w-full h-full border-0"
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
