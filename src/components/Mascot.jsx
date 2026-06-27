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
 * Original PNGs kept in assets/mascot/ as source; WebP are the compressed copies (≈50% smaller).
 */
const POSES = {
  happy: happyWebp,
  celebrate: celebrateWebp,
  encourage: encourageWebp,
  thinking: thinkingWebp,
  sleeping: sleepingWebp,
  waving: wavingWebp,
};

// Preload all 6 images at module load time — before any Mascot renders.
Object.values(POSES).forEach(src => { new Image().src = src; });

const FADE_MS = 120;

export default function Mascot({ emotion = 'happy', size = 120, className = '' }) {
  const [activeSrc, setActiveSrc] = useState(() => POSES[emotion] ?? POSES.happy);
  const [opacity, setOpacity] = useState(1);
  const timerRef = useRef(null);

  useEffect(() => {
    const nextSrc = POSES[emotion] ?? POSES.happy;
    if (nextSrc === activeSrc) return;

    clearTimeout(timerRef.current);
    setOpacity(0);
    timerRef.current = setTimeout(() => {
      setActiveSrc(nextSrc);
      setOpacity(1);
    }, FADE_MS);

    return () => clearTimeout(timerRef.current);
  }, [emotion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    // Outer div reserves layout space so nothing shifts before/between images.
    <div
      className={`mascot-breathe inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <img
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
      />
    </div>
  );
}
