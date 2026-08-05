import React, { useEffect, useRef } from 'react';
import { gemTitle, bonusLabel, money } from './gemsData';

// A single purple store card: image, title, price, and Info / Buy Now actions.
// Buy Now hands the package up to the checkout flow; Info opens the description
// modal. (No cart is ever surfaced — see GemCheckoutModal for why.)
//
// The whole tile is also clickable as an info shortcut. Both buttons stop
// propagation so they aren't double-handled — without that, Buy Now would open
// the info modal behind the checkout. The tile deliberately has no
// role/tabIndex: it already contains two real buttons, so making it focusable
// too would nest interactive controls and add a duplicate tab stop. Keyboard
// and screen-reader users get the same actions from the buttons themselves.
//
// `insane` marks a top-tier bonus (see isInsaneBonus), whose badge pulses wider
// than the rest and glitches out on top of it (see gems.scss). Several cards can
// carry it at once; each runs its own timer below, so they never fall in step.
export const GemPackageCard = ({ pkg, onInfo, onBuy, insane = false }) => {
  const title = gemTitle(pkg);
  const badge = bonusLabel(pkg);
  const glitchRef = useRef(null);

  // Each glitch burst is fired from here rather than looped in CSS. A keyframe
  // loop repeats on a fixed beat, which the eye picks out as a pattern within a
  // few seconds — re-rolling the transforms AND the gap before every burst is
  // what keeps it reading as a badge that genuinely can't hold itself together.
  useEffect(() => {
    const el = glitchRef.current;
    if (!insane || !el) return undefined;
    // CSS disables the animation under reduced motion, so a burst would never
    // end and never reschedule; don't start the cycle at all.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const rand = (lo, hi) => lo + Math.random() * (hi - lo);
    const sign = () => (Math.random() < 0.5 ? -1 : 1);
    const flip = (chance) => (Math.random() < chance ? '-1' : '1');
    let timer;

    // The burst runs twelve poses (see gems.scss), so this duration divided by
    // twelve is how long each deformed state holds — keep it short enough that
    // the pill machine-guns through them rather than posing in each one.
    const burst = () => {
      el.style.setProperty('--g-dur', `${rand(0.3, 0.52).toFixed(2)}s`);
      el.style.setProperty('--g-rot-a', `${(rand(6, 20) * sign()).toFixed(1)}deg`);
      el.style.setProperty('--g-rot-b', `${(rand(6, 20) * sign()).toFixed(1)}deg`);
      el.style.setProperty('--g-rot-c', `${(rand(2, 12) * sign()).toFixed(1)}deg`);
      el.style.setProperty('--g-rot-d', `${(rand(4, 16) * sign()).toFixed(1)}deg`);
      el.style.setProperty('--g-skew', `${(rand(8, 22) * sign()).toFixed(1)}deg`);
      el.style.setProperty('--g-skew-b', `${(rand(6, 18) * sign()).toFixed(1)}deg`);
      el.style.setProperty('--g-scale-a', rand(1.05, 1.35).toFixed(2));
      el.style.setProperty('--g-scale-b', rand(0.7, 0.95).toFixed(2));
      el.style.setProperty('--g-scale-c', rand(1.15, 1.45).toFixed(2));
      el.style.setProperty('--g-x', `${(rand(2, 7) * sign()).toFixed(1)}px`);
      el.style.setProperty('--g-y', `${(rand(2, 6) * sign()).toFixed(1)}px`);
      // Mirroring only some of the time, so plain wobbles and full flips stay
      // mixed instead of every burst turning the badge backwards.
      el.style.setProperty('--g-flip-x', flip(0.5));
      el.style.setProperty('--g-flip-y', flip(0.35));
      el.classList.add('isGlitching');
    };

    // Removing the class on animationend is what arms the next burst. The gap
    // stays short — long pauses made it read as an occasional twitch rather
    // than something that can't settle — but never shorter than a frame or two,
    // so re-adding the class reliably restarts the animation.
    const rest = () => {
      el.classList.remove('isGlitching');
      timer = setTimeout(burst, rand(60, 700));
    };

    el.addEventListener('animationend', rest);
    timer = setTimeout(burst, rand(60, 700));

    return () => {
      clearTimeout(timer);
      el.removeEventListener('animationend', rest);
      el.classList.remove('isGlitching');
    };
  }, [insane]);

  return (
    <div className="gemCard shadow-darker" onClick={() => onInfo(pkg)}>
      {badge && (
        <div className={`gemCardBadge${insane ? ' gemCardBadge--insane' : ''}`}>
          {/* Inner layer purely so the glitch has its own `transform` to drive:
              the badge itself is already using one for the pulse. */}
          <span className="gemBadgeGlitch" ref={glitchRef}>
            <span className="gemPlus">+</span>
            {badge}
          </span>
        </div>
      )}

      <div className="gemCardImageWrap">
        <img className="gemCardImage" src={pkg.image} alt={title} loading="lazy" />
      </div>

      <h3 className="gemCardTitle">{title}</h3>
      <div className="gemCardPrice">{money(pkg.priceUSD)}</div>

      <div className="gemCardActions">
        <button
          type="button"
          className="gemInfoBtn"
          onClick={(e) => {
            e.stopPropagation();
            onInfo(pkg);
          }}
          aria-label={`More info about ${title}`}
        >
          <i className="fa fa-info-circle" aria-hidden="true" /> Info
        </button>
        <button
          type="button"
          className="gemBuyBtn"
          onClick={(e) => {
            e.stopPropagation();
            onBuy(pkg);
          }}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};
