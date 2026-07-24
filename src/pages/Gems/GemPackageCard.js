import React from 'react';
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
export const GemPackageCard = ({ pkg, onInfo, onBuy }) => {
  const title = gemTitle(pkg);
  const badge = bonusLabel(pkg);

  return (
    <div className="gemCard shadow-darker" onClick={() => onInfo(pkg)}>
      {badge && (
        <div className="gemCardBadge">
          <span className="gemPlus">+</span>
          {badge}
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
