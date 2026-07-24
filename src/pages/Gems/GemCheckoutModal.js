import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactModal from 'react-modal';
import { SHOP_ORIGIN, gemTitle, money } from './gemsData';

const FRAME_NAME = 'gemCheckoutFrame';
// Safety net: if a cross-origin load event is ever missed, advance anyway.
const STEP_TIMEOUT_MS = 9000;

// The checkout modal. It wraps the REAL CraftingStore /checkout/basket page in
// an iframe and drives it "blindly": we can navigate the frame and POST into it,
// but the same-origin policy means we can never read its DOM, URL, or load
// result. So the sequence below is choreographed purely off the iframe's load
// events (which DO fire cross-origin) with a timeout fallback:
//
//   1. GET  /checkout/basket/forget      -> empty whatever was in the basket
//   2. POST /checkout/{id}  (form target -> frame) -> add exactly this package
//   3. GET  /checkout/basket             -> show the real name/email/gateway/
//                                            coupon/TOS checkout form
//
// The user never sees a cart; from their view Buy Now goes straight to checkout.
export const GemCheckoutModal = ({ pkg, onClose }) => {
  const open = !!pkg;
  const iframeRef = useRef(null);
  const formHostRef = useRef(null);
  const [phase, setPhase] = useState('preparing'); // 'preparing' | 'ready'

  // Add-to-basket must be a POST (GET /checkout/{id} only shows the product
  // page). A transient hidden form whose target is the iframe does the POST
  // using the shop's own cookies — no backend, no CSRF token needed.
  const submitAdd = useCallback((id) => {
    const host = formHostRef.current;
    if (!host) return;
    host.innerHTML = '';
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${SHOP_ORIGIN}/checkout/${id}`;
    form.target = FRAME_NAME;
    // mc_name here is throwaway — the real in-game name is collected on the
    // checkout page. It just needs to be present for the add to succeed.
    const fields = { type: 'checkout', mc_name: 'Player' };
    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    host.appendChild(form);
    form.submit();
  }, []);

  useEffect(() => {
    if (!open || !pkg) return undefined;
    const iframe = iframeRef.current;
    if (!iframe) return undefined;

    let cancelled = false;
    setPhase('preparing');

    // Navigate (via `doNav`) and resolve on the frame's next load event, or
    // after STEP_TIMEOUT_MS. A fresh one-shot listener per step keeps the steps
    // from interfering with one another (and ignores the initial about:blank).
    const navigate = (doNav) =>
      new Promise((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          iframe.removeEventListener('load', finish);
          resolve();
        };
        const timer = setTimeout(finish, STEP_TIMEOUT_MS);
        iframe.addEventListener('load', finish);
        doNav();
      });

    (async () => {
      await navigate(() => {
        iframe.src = `${SHOP_ORIGIN}/checkout/basket/forget`;
      });
      if (cancelled) return;
      await navigate(() => submitAdd(pkg.id));
      if (cancelled) return;
      await navigate(() => {
        iframe.src = `${SHOP_ORIGIN}/checkout/basket`;
      });
      if (cancelled) return;
      setPhase('ready');
    })();

    return () => {
      cancelled = true;
      if (formHostRef.current) formHostRef.current.innerHTML = '';
    };
  }, [open, pkg, submitAdd]);

  return (
    <ReactModal
      isOpen={open}
      onRequestClose={onClose}
      className={{
        base: 'gemModal gemCheckoutModal',
        afterOpen: 'gemModal--after-open',
        beforeClose: 'gemModal--before-close',
      }}
      overlayClassName={{
        base: 'gemModalOverlay',
        afterOpen: 'gemModalOverlay--after-open',
        beforeClose: 'gemModalOverlay--before-close',
      }}
      contentLabel="Checkout"
      ariaHideApp={false}
    >
      <div className="gemModalHeader">
        <h2>Checkout</h2>
        <button className="gemModalClose" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {pkg && (
        <div className="gemCheckoutSummary">
          <span className="gemCheckoutSummaryName">{gemTitle(pkg)}</span>
          <span className="gemCheckoutSummaryPrice">{money(pkg.priceUSD)}</span>
        </div>
      )}

      <div className="gemCheckoutFrameWrap">
        <iframe
          ref={iframeRef}
          name={FRAME_NAME}
          title="FaceGems checkout"
          className="gemCheckoutFrame"
          src="about:blank"
        />
        {phase === 'preparing' && (
          <div className="gemCheckoutOverlay">
            <div className="gemSpinner" aria-hidden="true" />
            <p>Preparing your order…</p>
          </div>
        )}
      </div>

      <div className="gemCheckoutFooter">
        <span>Secure checkout, powered by CraftingStore.</span>
        <a href={`${SHOP_ORIGIN}/checkout/basket`} target="_blank" rel="noopener noreferrer">
          Having trouble? Open classic checkout&nbsp;↗
        </a>
      </div>

      {/* Hidden host for the transient add-to-basket POST form. */}
      <div ref={formHostRef} style={{ display: 'none' }} />
    </ReactModal>
  );
};
