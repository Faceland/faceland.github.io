import React, { useEffect, useRef, useState } from 'react';
import ReactModal from 'react-modal';
import { SHOP_ORIGIN, gemTitle, money } from './gemsData';
import { MC_NAME_RE, MC_NAME_PATTERN, lookupMinecraftName } from './minecraftName';

const FRAME_NAME = 'gemCheckoutFrame';
const STORE_TOS = `${SHOP_ORIGIN}/terms`;
const CS_TOS = 'https://craftingstore.net/terms';

// The store's two live gateways (read off the real checkout page's .gateways).
const GATEWAYS = [
  { value: 'paypal', label: 'PayPal', icon: 'fa-paypal' },
  { value: 'stripe', label: 'Credit / Debit Card', icon: 'fa-credit-card' },
];

// Enough to gate the button; the input's type="email" does the strict checking.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_CHECK_DELAY_MS = 1000;

// Custom, on-brand checkout. It renders OUR OWN form and drives a HIDDEN
// CraftingStore iframe underneath: on submit we clear the basket, add exactly
// this package, apply any coupon, then hand the payment form off to the TOP
// window so the browser goes to PayPal/Stripe. The shop's own checkout page is
// never shown. We can drive the iframe (navigate + POST into it, using its
// cookies) but never read it, so coupon validity / totals can't be reflected
// here — the gateway shows the final amount.
export const GemCheckoutModal = ({ pkg, onClose }) => {
  const open = !!pkg;
  const iframeRef = useRef(null);
  const formHostRef = useRef(null);

  const [mcName, setMcName] = useState('');
  const [email, setEmail] = useState('');
  const [gateway, setGateway] = useState('paypal');
  const [coupon, setCoupon] = useState('');
  const [showCoupon, setShowCoupon] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Name verification. A pause in typing triggers a format check and then a
  // real-account lookup, because a fake name breaks fulfilment.
  // Statuses: idle | typing | badFormat | checking | ok | notFound | unverified
  const [nameStatus, setNameStatus] = useState('idle');

  useEffect(() => {
    if (!mcName) {
      setNameStatus('idle');
      return undefined;
    }
    // Stay quiet while they're mid-word — no error flashing on every keystroke.
    setNameStatus('typing');

    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (!MC_NAME_RE.test(mcName)) {
        setNameStatus('badFormat');
        return;
      }
      setNameStatus('checking');
      lookupMinecraftName(mcName, controller.signal)
        .then((exists) => {
          // `null` means we couldn't reach the lookup — let it through rather
          // than blocking a real customer behind a third-party outage.
          if (exists === false) setNameStatus('notFound');
          else if (exists === true) setNameStatus('ok');
          else setNameStatus('unverified');
        })
        .catch(() => {
          /* aborted: a newer keystroke owns the state now */
        });
    }, NAME_CHECK_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [mcName]);

  const nameInvalid = nameStatus === 'badFormat' || nameStatus === 'notFound';
  const nameAccepted = nameStatus === 'ok' || nameStatus === 'unverified';
  const canSubmit = nameAccepted && EMAIL_RE.test(email.trim()) && !processing;

  // Reset transient state each time the modal opens.
  useEffect(() => {
    if (open) {
      setProcessing(false);
      setError(null);
      if (formHostRef.current) formHostRef.current.innerHTML = '';
    }
  }, [open, pkg]);

  // Resolve on the hidden iframe's next load (fires cross-origin; opaque) or
  // after maxMs. Listener attached before the navigation so a fast load can't
  // slip past.
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

  const waitForIframe = async () => {
    for (let waited = 0; waited < 4000; waited += 50) {
      if (iframeRef.current) return iframeRef.current;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 50));
    }
    return iframeRef.current;
  };

  // Build a transient hidden form and submit it (into the iframe or _top).
  // These CraftingStore forms carry no CSRF token, so this works with just the
  // shop's own cookies — no backend.
  const submitForm = (action, fields, target) => {
    const host = formHostRef.current;
    if (!host) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    form.target = target;
    form.acceptCharset = 'UTF-8';
    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    host.appendChild(form);
    form.submit();
  };

  const driveFrame = async (iframe, doNav, maxMs = 6000) => {
    const loaded = afterNextLoad(iframe, maxMs);
    doNav();
    await loaded;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (processing) return;
    if (!MC_NAME_RE.test(mcName)) {
      setError('Please enter a valid Minecraft username: 3–16 letters, numbers, or underscores.');
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const iframe = await waitForIframe();
      if (!iframe) throw new Error('checkout frame unavailable');
      if (formHostRef.current) formHostRef.current.innerHTML = '';

      const name = mcName.trim();

      // 1. Clear the basket. Cache-busted: the CDN caches the plain GET, which
      //    is why a stale basket kept its previous item.
      await driveFrame(iframe, () => {
        iframe.src = `${SHOP_ORIGIN}/checkout/basket/forget?_=${Date.now()}`;
      });

      // 2. Add exactly this package, with the real in-game name.
      await driveFrame(iframe, () => {
        submitForm(`${SHOP_ORIGIN}/checkout/${pkg.id}`, { type: 'checkout', mc_name: name }, FRAME_NAME);
      });

      // 3. Apply a coupon if one was entered (fire-and-forget — can't read it).
      if (coupon.trim()) {
        await driveFrame(iframe, () => {
          submitForm(`${SHOP_ORIGIN}/checkout/coupons/add`, { coupon: coupon.trim() }, FRAME_NAME);
        });
      }

      // 4. Hand off to the gateway: submit the payment form to the TOP window,
      //    so the browser navigates to PayPal/Stripe to finish paying.
      submitForm(
        `${SHOP_ORIGIN}/checkout/basket/payment`,
        { mc_name: name, email: email.trim(), gateway, tos: 'on', tos_cs: 'on' },
        '_top',
      );
      // Page navigates away now; leave the processing overlay up.
    } catch (err) {
      setProcessing(false);
      setError(
        "We couldn't reach the store to prepare your order. Please try the classic checkout link below.",
      );
    }
  };

  return (
    <ReactModal
      isOpen={open}
      onRequestClose={processing ? undefined : onClose}
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

      <form className="gemCheckoutForm" onSubmit={handleSubmit}>
        <div className="gemField">
          <label htmlFor="gemMcName">In-game name</label>
          <input
            id="gemMcName"
            type="text"
            value={mcName}
            // Spaces are never valid in a Minecraft name — strip them as typed
            // or pasted so the raw value always matches what we validate.
            onChange={(e) => setMcName(e.target.value.replace(/\s/g, ''))}
            placeholder="Your Minecraft username"
            autoComplete="off"
            spellCheck="false"
            autoCapitalize="none"
            maxLength={16}
            pattern={MC_NAME_PATTERN}
            title="3–16 characters, using only letters, numbers, and underscores"
            aria-invalid={nameInvalid || undefined}
            aria-describedby={nameInvalid ? 'gemMcNameError' : undefined}
            required
          />
          {nameStatus === 'badFormat' && (
            <small id="gemMcNameError" className="gemFieldError">
              Minecraft names are 3–16 characters, using only letters, numbers, and underscores.
            </small>
          )}
          {nameStatus === 'notFound' && (
            <small id="gemMcNameError" className="gemFieldError">
              We couldn&rsquo;t find a Minecraft account with that name — check the spelling.
            </small>
          )}
          {nameStatus === 'checking' && (
            <small className="gemFieldHint">Checking that name&hellip;</small>
          )}
          {nameStatus === 'ok' && <small className="gemFieldOk">✓ Account found</small>}
          {nameStatus === 'unverified' && (
            <small className="gemFieldHint">
              Couldn&rsquo;t verify that name right now — you can still continue.
            </small>
          )}
        </div>

        <div className="gemField">
          <label htmlFor="gemEmail">Email</label>
          <input
            id="gemEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="gemField">
          <span className="gemFieldLabel">Payment method</span>
          <div className="gemGateways">
            {GATEWAYS.map((g) => (
              <label
                key={g.value}
                className={`gemGateway ${gateway === g.value ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="gemGateway"
                  value={g.value}
                  checked={gateway === g.value}
                  onChange={() => setGateway(g.value)}
                />
                <i className={`fa ${g.icon}`} aria-hidden="true" />
                <span>{g.label}</span>
              </label>
            ))}
          </div>
        </div>

        {showCoupon ? (
          <div className="gemField">
            <label htmlFor="gemCoupon">Coupon or gift card</label>
            <input
              id="gemCoupon"
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter a code (optional)"
              autoComplete="off"
            />
            <small className="gemFieldHint">The discount is shown on the payment page.</small>
          </div>
        ) : (
          <button
            type="button"
            className="gemCouponToggle"
            onClick={() => setShowCoupon(true)}
          >
            Have a coupon?
          </button>
        )}

        <label className="gemTos">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          <span>
            I agree to the{' '}
            <a href={STORE_TOS} target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href={CS_TOS} target="_blank" rel="noopener noreferrer">
              CraftingStore&rsquo;s Terms
            </a>
            , and confirm I&rsquo;m 18+ or have guardian permission.
          </span>
        </label>

        {error && <div className="gemCheckoutError">{error}</div>}

        <button type="submit" className="gemBuyBtn gemCheckoutSubmit" disabled={!canSubmit}>
          {gateway === 'paypal' ? 'Continue to PayPal' : 'Continue to Card Payment'} ·{' '}
          {pkg ? money(pkg.priceUSD) : ''}
        </button>
      </form>

      <div className="gemCheckoutFooter">
        <span>You&rsquo;ll finish paying securely on {gateway === 'paypal' ? 'PayPal' : 'the card'} page.</span>
        <a href={`${SHOP_ORIGIN}/checkout/basket`} target="_blank" rel="noopener noreferrer">
          Issues? Click for classic checkout!&nbsp;↗
        </a>
      </div>

      {processing && (
        <div className="gemCheckoutOverlay">
          <div className="gemSpinner" aria-hidden="true" />
          <p>Preparing your order…</p>
        </div>
      )}

      {/* Hidden engine: the CraftingStore session the form drives. */}
      <iframe
        ref={iframeRef}
        name={FRAME_NAME}
        title="checkout engine"
        className="gemHiddenFrame"
        src="about:blank"
      />
      <div ref={formHostRef} className="gemHiddenFrame" />
    </ReactModal>
  );
};
