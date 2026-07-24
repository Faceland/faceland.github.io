import React, { useEffect, useRef } from 'react';
import ReactModal from 'react-modal';
import { dropGemConfetti } from './gemConfetti';

// Post-payment result. CraftingStore returns the buyer to
// /gems?payment=success (or ?payment=failed); Gems.js maps that to `status`,
// shows this, and strips the param when it closes.
//
// Spellings are tolerated both ways because the exact value the gateway appends
// isn't guaranteed — anything unrecognised simply shows no modal.
const SUCCESS = ['success', 'succeeded', 'complete', 'completed', 'paid'];
const FAILURE = ['failed', 'failure', 'error', 'cancel', 'canceled', 'cancelled', 'declined'];

export const paymentStatusFrom = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (SUCCESS.includes(v)) return 'success';
  if (FAILURE.includes(v)) return 'failed';
  return null;
};

export const GemResultModal = ({ status, onClose }) => {
  const success = status === 'success';
  const firedRef = useRef(false);

  // Rain FaceGems on arrival, once per success. Reset when the status clears so
  // a later purchase celebrates again. Intentionally no cleanup — the confetti
  // self-removes, so closing the modal doesn't cut it short.
  useEffect(() => {
    if (success && !firedRef.current) {
      firedRef.current = true;
      dropGemConfetti();
    } else if (!success) {
      firedRef.current = false;
    }
  }, [success]);

  return (
    <ReactModal
      isOpen={!!status}
      onRequestClose={onClose}
      className={{
        base: `gemModal gemResultModal ${success ? '' : 'is-error'}`,
        afterOpen: 'gemModal--after-open',
        beforeClose: 'gemModal--before-close',
      }}
      overlayClassName={{
        base: 'gemModalOverlay',
        afterOpen: 'gemModalOverlay--after-open',
        beforeClose: 'gemModalOverlay--before-close',
      }}
      contentLabel={success ? 'Payment successful' : 'Payment failed'}
      ariaHideApp={false}
    >
      <div className={`gemModalHeader ${success ? '' : 'is-error'}`}>
        <h2>{success ? 'Payment Successful' : 'Payment Failed'}</h2>
        <button className="gemModalClose" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="gemModalBody gemResultBody">
        <div className="gemResultIcon" aria-hidden="true">
          {success ? (
            <img className="gemResultGem pixelImage" src="/assets/images/XAhGG80.png" alt="" />
          ) : (
            '⚠️'
          )}
        </div>
        <p>
          {success
            ? 'Payment successful! You will receive your GEMS in game shortly!'
            : 'Something went wrong with your payment! Please try again later!'}
        </p>
      </div>

      <div className="gemModalFooter gemResultFooter">
        <button className="gemBuyBtn" onClick={onClose}>
          {success ? 'Yay!' : 'OK'}
        </button>
      </div>
    </ReactModal>
  );
};
