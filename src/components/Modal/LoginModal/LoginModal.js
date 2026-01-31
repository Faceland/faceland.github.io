import React from 'react';
import ReactModal from 'react-modal';

import './loginModal.scss';

export const LoginModal = ({ isOpen, close }) => {
  return (
    <ReactModal
      className="loginModal"
      isOpen={isOpen}
      onRequestClose={close}
      contentLabel="Login Modal"
    >
      <button className="closeButton" onClick={close} aria-label="Close login modal">
        X
      </button>
      <div className="loginModalContent">
        <h2>GREETINGS NERD</h2>
        <div>
          Please provide your secure authentication credentials, dipshit
        </div>
        <input placeholder="memefucker69@hotmail.gov" aria-label="Email address" />
        <input placeholder="P@sswerd" aria-label="Password" type="password" />
      </div>
    </ReactModal>
  );
};
