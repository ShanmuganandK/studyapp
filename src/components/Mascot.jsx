import { useEffect, useRef, useState } from 'react';

import happyWebp from '../assets/mascot/webp/Tinku_Happy_2.webp';
import celebrateWebp from '../assets/mascot/webp/Tinku_Mascot.webp';
import encourageWebp from '../assets/mascot/webp/Tinku_Encourage_2.webp';
import thinkingWebp from '../assets/mascot/webp/Tinku_Think3.webp';
import sleepingWebp from '../assets/mascot/webp/Tinku_Sleeping.webp';
import wavingWebp from '../assets/mascot/webp/Tinku_Bye.webp';

/**
 * Tinku — the mascot. Flat 2D blue-grey elephant, light/Wonder theme (DECISIONS).
 * Six production poses mapped to the moments the quiz loop needs. Tinku is NEVER sad:
 * wrong answers get 'encourage', never disappointment.
 *
 * All 6 WebP images are preloaded at module init so emotion changes are instant from cache.
 * Container size is reserved (width/height on outer div) so layout never shifts on load.
 * Emotion changes cross-fade via opacity (GPU-only, low-end-Android safe).
 *
 * Loading robustness: opacity starts at 0 and is revealed only after the image confirms
 * it's ready — so a slow/failed first fetch shows reserved space, never a broken-image icon.
 * Cache-hit gotcha: React onLoad doesn't fire when an image loads synchronously from cache
 * before the event listener attaches. The img.complete check in the effect covers this case.
 * onError retries once after 1.5s (transient CDN hiccup); if still fails, space stays blank.
 */
const POSES = {
  happy: happyWebp,
  celebrate: celebrateWebp,
  encourage: encourageWebp,
  thinking: thinkingWebp,
  sleeping: sleepingWebp,
  waving: wavingWebp,
};

// Warm the browser cache for all poses at module load time — best-effort, non-blocking.
Object.values(POSES).forEach(src => { new Image().src = src; });

const FADE_MS = 120;

export default function Mascot({ emotion = 'happy', size = 120, className = '' }) {
  const [activeSrc, setActiveSrc] = useState(() => POSES[emotion] ?? POSES.happy);
  // Start at opacity 0 — revealed only after the image confirms it is ready.
  const [opacity, setOpacity] = useState(0);
  // imgKey increments on retry to force the img element to remount and re-fetch.
  const [imgKey, setImgKey] = useState(0);
  const imgRef = useRef(null);
  const timerRef = useRef(null);
  const hasRetriedRef = useRef(false);

  // After every activeSrc / imgKey change the img remounts. If the browser already has the
  // image in cache it loads synchronously — img.complete is true but onLoad never fires
  // (React's synthetic onLoad misses synchronous cache hits for non-bubbling events).
  // The effect runs after the DOM commit, at which point img.complete is reliable.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setOpacity(1);
    }
  }, [activeSrc, imgKey]);

  useEffect(() => {
    const nextSrc = POSES[emotion] ?? POSES.happy;
    if (nextSrc === activeSrc) return;

    clearTimeout(timerRef.current);
    setOpacity(0);
    timerRef.current = setTimeout(() => {
      setActiveSrc(nextSrc);
      hasRetriedRef.current = false;
      setImgKey(0);
    }, FADE_MS);

    return () => clearTimeout(timerRef.current);
  }, [emotion]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLoad() {
    setOpacity(1);
  }

  function handleError() {
    // Retry once after a short delay — covers transient CDN/network hiccup.
    // On second failure: imgKey stays at 1, opacity stays 0 → reserved space, no broken icon.
    if (!hasRetriedRef.current) {
      hasRetriedRef.current = true;
      setTimeout(() => setImgKey(1), 1500);
    }
  }

  return (
    // Outer div reserves layout space so nothing shifts before/between images.
    <div
      className={`mascot-breathe inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        ref={imgRef}
        key={`${activeSrc}-${imgKey}`}
        src={activeSrc}
        alt={`Tinku looking ${emotion}`}
        className="select-none pointer-events-none"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          opacity,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
        draggable={false}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
