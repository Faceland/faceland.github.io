import React from 'react';
import ReactModal from 'react-modal';
import { gemTitle, bonusLabel, money, descriptionHtml } from './gemsData';

// The "Info" popup — our own re-skin of CraftingStore's per-package modal.
// Shows the package blurb and offers a Buy Now that hands off to checkout.
// Object-form className/overlayClassName so we DON'T inherit react-modal's
// default classes (another modal in the app globally restyles those).
export const GemInfoModal = ({ pkg, onClose, onBuy }) => (
  <ReactModal
    isOpen={!!pkg}
    onRequestClose={onClose}
    className={{
      base: 'gemModal gemInfoModal',
      afterOpen: 'gemModal--after-open',
      beforeClose: 'gemModal--before-close',
    }}
    overlayClassName={{
      base: 'gemModalOverlay',
      afterOpen: 'gemModalOverlay--after-open',
      beforeClose: 'gemModalOverlay--before-close',
    }}
    contentLabel="Package details"
    ariaHideApp={false}
  >
    {pkg && (
      <>
        <div className="gemModalHeader">
          <h2>{gemTitle(pkg)}</h2>
          <button className="gemModalClose" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="gemModalBody">
          <div className="gemInfoImageWrap">
            <img className="gemInfoImage" src={pkg.image} alt={gemTitle(pkg)} />
            {bonusLabel(pkg) && (
              <div className="gemCardBadge gemInfoBadge">
                <span className="gemPlus">+</span>
                {bonusLabel(pkg)}
              </div>
            )}
          </div>
          <div
            className="gemInfoDesc"
            dangerouslySetInnerHTML={{ __html: descriptionHtml(pkg) }}
          />
        </div>

        <div className="gemModalFooter">
          <div className="gemInfoPrice">{money(pkg.priceUSD)}</div>
          <button className="gemBuyBtn" onClick={() => onBuy(pkg)}>
            Buy Now
          </button>
        </div>
      </>
    )}
  </ReactModal>
);
