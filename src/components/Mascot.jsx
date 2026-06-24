import happy from '../assets/mascot/Tinku_Happy_2.png';
import celebrate from '../assets/mascot/Tinku_Mascot.png';
import encourage from '../assets/mascot/Tinku_Encourage_2.png';
import thinking from '../assets/mascot/Tinku_Think3.png';
import sleeping from '../assets/mascot/Tinku_Sleeping.png';
import waving from '../assets/mascot/Tinku_Bye.png';

/**
 * Tinku — the mascot. Flat 2D blue-grey elephant, light/Wonder theme (DECISIONS).
 * Six production poses mapped to the moments the quiz loop needs. Tinku is NEVER sad:
 * wrong answers get 'encourage', never disappointment.
 *
 * Animations are CSS (transform/opacity only) for low-end Android — see index.css.
 */
const POSES = { happy, celebrate, encourage, thinking, sleeping, waving };

export default function Mascot({ emotion = 'happy', size = 120, className = '' }) {
  const src = POSES[emotion] ?? POSES.happy;
  return (
    <div className={`mascot-breathe inline-block ${className}`}>
      <img
        key={emotion} // remount on change so the pop-in animation replays
        src={src}
        alt={`Tinku looking ${emotion}`}
        className="mascot-pose select-none pointer-events-none"
        style={{ width: size, height: size, objectFit: 'contain' }}
        draggable={false}
      />
    </div>
  );
}
