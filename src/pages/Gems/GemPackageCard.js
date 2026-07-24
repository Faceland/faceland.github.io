import React from 'react';
import { gemTitle, bonusLabel, money } from './gemsData';

// A single purple store card: image, title, price, and Info / Buy Now actions.
// Buy Now hands the package up to the checkout flow; Info opens the description
// modal. (No cart is ever surfaced — see GemCheckoutModal for why.)
export const GemPackageCard = ({ pkg, onInfo, onBuy }) => {
  const title = gemTitle(pkg);
  const badge = bonusLabel(pkg);

  return (
    <div className="gemCard shadow-darker">
      {badge && <div className="gemCardBadge">{badge}</div>}

      <div className="gemCardImageWrap">
        <img className="gemCardImage" src={pkg.image} alt={title} loading="lazy" />
      </div>

      <h3 className="gemCardTitle">{title}</h3>
      <div className="gemCardPrice">{money(pkg.priceUSD)}</div>

      <div className="gemCardActions">
        <button
          type="button"
          className="gemInfoBtn"
          onClick={() => onInfo(pkg)}
          aria-label={`More info about ${title}`}
        >
          <i className="fa fa-info-circle" aria-hidden="true" /> Info
        </button>
        <button type="button" className="gemBuyBtn" onClick={() => onBuy(pkg)}>
          Buy Now
        </button>
      </div>
    </div>
  );
};
