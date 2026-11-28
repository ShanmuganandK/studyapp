import { useEffect, useRef, useState } from 'react';

// Note the file↔emotion pairing: Tinku_Mascot is the calm standing pose (the neutral default),
// Tinku_Happy_2 is the arms-up + confetti pose (the real win celebration). Mapped accordingly so
// win moments (correct / session-end) actually celebrate and headers/greetings stay calm.
import happyWebp from '../assets/mascot/webp/Tinku_Mascot.webp';
import celebrateWebp from '../assets/mascot/webp/Tinku_Happy_2.webp';
import encourageWebp from '../assets/mascot/webp/Tinku_Encourage_2.webp';
import thinkingWebp from '../assets/mascot/webp/Tinku_Think3.webp';
import sleepingWebp from '../assets/mascot/webp/Tinku_Sleeping.webp';
import wavingWebp from '../assets/mascot/webp/Tinku_Bye.webp';
// Vector art (F6 hero): puppet-rigged original trace of the waving art, sharp at any size.
import wavingSvg from '../assets/mascot/svg/Tinku_Wave.svg';

// Detached prop layers extracted from the 2000×2000 originals (`scripts/build-mascot-layers.py`),
// aligned 1:1 to each pose's 1024×1024 frame so props float, twinkle, and burst independently.
import thinkingStarWebp from '../assets/mascot/webp/layers/Tinku_Think3_star.webp';
import thinkingQmarkWebp from '../assets/mascot/webp/layers/Tinku_Think3_qmark.webp';
import encourageStarWebp from '../assets/mascot/webp/layers/Tinku_Encourage_2_star.webp';
import celebrateStarWebp from '../assets/mascot/webp/layers/Tinku_Happy_2_star.webp';
import celebrateConfettiWebp from '../assets/mascot/webp/layers/Tinku_Happy_2_confetti.webp';
import sleepingZzzWebp from '../assets/mascot/webp/layers/Tinku_Sleeping_zzz.webp';

/**
 * Tinku — the mascot. Flat 2D blue-grey elephant, light/Wonder theme (DECISIONS).
 * Six production poses mapped to the moments the quiz loop needs. Tinku is NEVER sad:
 * wrong answers get 'encourage', never disappointment.
 *
 * All base WebPs, detached prop layers, and the Hero SVG are preloaded at module init so
 * emotion swaps are instant from cache. Container size is reserved (width/height on outer div)
 * so layout never shifts on load. Emotion changes cross-fade via opacity (GPU-only).
 */
const POSES = {
  happy: happyWebp,
  celebrate: celebrateWebp,
  encourage: encourageWebp,
  thinking: thinkingWebp,
  sleeping: sleepingWebp,
  waving: wavingWebp,
};

const VECTOR_POSES = { waving: wavingSvg };

const PROP_LAYERS = {
  thinking: [
    { src: thinkingStarWebp, cls: 'mascot-prop-star', origin: '18.4% 25.7%' },
    { src: thinkingQmarkWebp, cls: 'mascot-prop-qmark', origin: '25.0% 14.9%' },
  ],
  encourage: [
    { src: encourageStarWebp, cls: 'mascot-prop-star', origin: '18.3% 25.8%' },
  ],
  celebrate: [
    { src: celebrateConfettiWebp, cls: 'mascot-prop-confetti', origin: '50% 42.6%' },
    { src: celebrateStarWebp, cls: 'mascot-prop-star-win', origin: '68.9% 12.7%' },
  ],
  sleeping: [
    { src: sleepingZzzWebp, cls: 'mascot-prop-zzz', origin: '20.0% 23.8%' },
  ],
};

// Emotion-tuned GPU-only choreography (falls back to gentle breathe for calm/waving poses).
const MOTION_CLASS = {
  celebrate: 'mascot-celebrate',
  thinking: 'mascot-thinking',
  encourage: 'mascot-encourage',
  sleeping: 'mascot-sleeping',
  happy: 'mascot-breathe',
  waving: 'mascot-breathe',
};

/** The art for a pose: the vector version when asked for and one exists, else the WebP. */
const artFor = (emotion, vector) => (vector && VECTOR_POSES[emotion]) || POSES[emotion] || POSES.happy;

// Warm the browser cache for all poses & prop layers at module load time — best-effort, non-blocking.
[
  ...Object.values(POSES),
  ...Object.values(VECTOR_POSES),
  ...Object.values(PROP_LAYERS).flat().map((p) => p.src),
].forEach((src) => {
  new Image().src = src;
});

const FADE_MS = 120;

export default function Mascot({ emotion = 'happy', size = 120, className = '', vector = false, breathe = true }) {
  const [activeSrc, setActiveSrc] = useState(() => artFor(emotion, vector));
  const [activeEmotion, setActiveEmotion] = useState(emotion);
  // Start at opacity 0 — revealed only after the image confirms it is ready.
  const [opacity, setOpacity] = useState(0);
  // imgKey increments on retry to force the img element to remount and re-fetch.
  const [imgKey, setImgKey] = useState(0);
  const imgRef = useRef(null);
  const timerRef = useRef(null);
  const hasRetriedRef = useRef(false);
  const lastGoodSrcRef = useRef(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      lastGoodSrcRef.current = activeSrc;
      setOpacity(1);
    }
  }, [activeSrc, imgKey]);

  useEffect(() => {
    const nextSrc = artFor(emotion, vector);
    if (nextSrc === activeSrc) {
      clearTimeout(timerRef.current);
      setActiveEmotion(emotion);
      if (
        lastGoodSrcRef.current === activeSrc ||
        (imgRef.current?.complete && imgRef.current?.naturalWidth > 0)
      ) {
        setOpacity(1);
      }
      return;
    }

    clearTimeout(timerRef.current);
    setOpacity(0);
    timerRef.current = setTimeout(() => {
      setActiveSrc(nextSrc);
      setActiveEmotion(emotion);
      hasRetriedRef.current = false;
      setImgKey(0);
    }, FADE_MS);

    return () => clearTimeout(timerRef.current);
  }, [emotion, vector]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLoad() {
    lastGoodSrcRef.current = activeSrc;
    setOpacity(1);
  }

  function handleError() {
    if (!hasRetriedRef.current) {
      hasRetriedRef.current = true;
      setTimeout(() => setImgKey(1), 1500);
      return;
    }
    const fallback = lastGoodSrcRef.current;
    if (fallback && fallback !== activeSrc) {
      setActiveSrc(fallback);
      setImgKey(0);
      hasRetriedRef.current = false;
    } else {
      setOpacity(1);
    }
  }

  const isVector = vector && !!VECTOR_POSES[activeEmotion];
  const propsForPose = isVector ? [] : (PROP_LAYERS[activeEmotion] ?? []);
  const motionClass = breathe ? (MOTION_CLASS[activeEmotion] ?? 'mascot-breathe') : '';

  return (
    // Outer div reserves layout space so nothing shifts before/between images.
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        ref={imgRef}
        key={`${activeSrc}-${imgKey}`}
        src={activeSrc}
        alt={`Tinku looking ${emotion}`}
        className={`select-none pointer-events-none block ${motionClass}`}
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
      {propsForPose.map((layer) => (
        <img
          key={layer.src}
          src={layer.src}
          alt=""
          aria-hidden="true"
          data-mascot-prop="true"
          className={`select-none pointer-events-none absolute inset-0 w-full h-full object-contain ${
            breathe ? layer.cls : ''
          }`}
          style={{
            transformOrigin: layer.origin,
            opacity,
            transition: `opacity ${FADE_MS}ms ease`,
          }}
          draggable={false}
        />
      ))}
    </div>
  );
}
