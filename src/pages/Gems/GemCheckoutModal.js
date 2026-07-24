import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactModal from 'react-modal';
import { SHOP_ORIGIN, gemTitle, money } from './gemsData';

const FRAME_NAME = 'gemCheckoutFrame';

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

    let cancelled = false;
    setPhase('preparing');

    const reveal = () => {
      if (!cancelled) setPhase('ready');
    };

    // Backstop armed FIRST, before we touch the iframe ref: react-modal mounts
    // its content into a portal that may not be attached on the tick this
    // effect first runs, so iframeRef can briefly be null. The overlay must
    // clear regardless — arming this after a ref check was the "hang forever".
    const safety = setTimeout(reveal, 12000);

    // Resolve on the iframe's next load event (fires even cross-origin; content
    // is opaque) or after maxMs. Listener attached BEFORE the navigation so a
    // fast load can't slip past.
    const afterNextLoad = (iframe, maxMs) =>
      new Promise((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          clearTimeout(t);
          iframe.removeEventListener('load', done);
          resolve();
        };
        const t = setTimeout(done, maxMs);
        iframe.addEventListener('load', done);
      });

    // The iframe ref may not be attached yet on the first run — poll briefly.
    const waitForIframe = async () => {
      for (let waited = 0; !cancelled && waited < 4000; waited += 50) {
        if (iframeRef.current) return iframeRef.current;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 50));
      }
      return iframeRef.current;
    };

    (async () => {
      try {
        const iframe = await waitForIframe();
        if (cancelled || !iframe) return;

        const s1 = afterNextLoad(iframe, 5000);
        iframe.src = `${SHOP_ORIGIN}/checkout/basket/forget`; // 1. clear
        await s1;
        if (cancelled) return;

        const s2 = afterNextLoad(iframe, 5000);
        submitAdd(pkg.id); // 2. add this package
        await s2;
        if (cancelled) return;

        const s3 = afterNextLoad(iframe, 6000);
        iframe.src = `${SHOP_ORIGIN}/checkout/basket`; // 3. show the real checkout
        await s3;
      } catch (err) {
        /* fall through — reveal whatever the frame ended up on */
      } finally {
        clearTimeout(safety);
        reveal();
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(safety);
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
