import React, { useState } from 'react';
import ReactModal from 'react-modal';

// ┌──────────────────────────────────────────────────────────────────────────┐
// │ TEMPORARY — "under construction" notice shown on every visit to /gems      │
// │ while the shop is being tested in production. To remove when the shop is   │
// │ live: delete this file, plus its import + <GemConstructionModal /> usage   │
// │ in Gems.js, and the "TEMP" block at the bottom of gems.scss.               │
// └──────────────────────────────────────────────────────────────────────────┘
export const GemConstructionModal = () => {
  const [open, setOpen] = useState(true);
  const close = () => setOpen(false);

  return (
    <ReactModal
      isOpen={open}
      onRequestClose={close}
      className={{
        base: 'gemModal gemNoticeModal',
        afterOpen: 'gemModal--after-open',
        beforeClose: 'gemModal--before-close',
      }}
      overlayClassName={{
        base: 'gemModalOverlay',
        afterOpen: 'gemModalOverlay--after-open',
        beforeClose: 'gemModalOverlay--before-close',
      }}
      contentLabel="Shop under construction"
      ariaHideApp={false}
    >
      <div className="gemModalHeader">
        <h2>🚧 Under Construction</h2>
        <button className="gemModalClose" onClick={close} aria-label="Close">
          ×
        </button>
      </div>

      <div className="gemModalBody gemNoticeBody">
        <p>
          <strong>The FaceGem shop is currently being worked on.</strong>
        </p>
        <p>
          We&rsquo;re testing a brand-new checkout experience.{' '}
          <strong>Please don&rsquo;t make any purchases right now</strong> — everything should be
          ready soon. Thanks for your patience!
        </p>
      </div>

      <div className="gemModalFooter gemNoticeFooter">
        <button className="gemBuyBtn" onClick={close}>
          Got it — just looking
        </button>
      </div>
    </ReactModal>
  );
};
