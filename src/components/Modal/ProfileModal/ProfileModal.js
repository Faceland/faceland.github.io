import React from 'react';
import ReactModal from 'react-modal';
import { LogoutButton } from '../../LogoutButton/AuthButton';
import { useAuth0 } from '@auth0/auth0-react';

import './profileModal.scss';

export const ProfileModal = ({ isOpen, close }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  const content = (
    <div>
      <img src={user?.picture} alt={user?.name} />
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
    </div>
  );

  const loadingContent = (
    <div>
      <img src="https://i.imgflip.com/2fw0fb.jpg" alt="placeholder loading" />
      <h2>Loading...</h2>
      <p>Loading...</p>
    </div>
  );

  if (!isAuthenticated || !user) {
    return (
      <ReactModal
        className="loginModal"
        isOpen={isOpen}
        onRequestClose={close}
        contentLabel="Login Modal"
      >
        <button className="closeButton" onClick={close}>
          X
        </button>
        <div className="loginModalContent">
          <h2>You are not logged in!</h2>
          <div>:(</div>
        </div>
      </ReactModal>
    );
  }

  return (
    <ReactModal
      className="loginModal"
      isOpen={isOpen}
      onRequestClose={close}
      contentLabel="Login Modal"
    >
      <button className="closeButton" onClick={close}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
      <div className="loginModalContent">
        <div className="flexCol">
          <div className="flexRow space-between width100">
            <div className="flexCol">
              <div className="profile-frame">
                <img
                  className="profile-image"
                  src={user?.picture}
                  alt={user?.name}
                />
              </div>
            </div>
            <div
              className="flexCol"
              style={{ paddingLeft: 20, paddingRight: 20, width: 300 }}
            >
              <div>MINECRAFT USERNAME</div>
              <div>{user?.email}</div>
              <div>GEM TOTAL</div>
            </div>
          </div>
          <div className="flexRow"></div>
          <div className="flexRow"></div>
        </div>
        <div style={{ marginTop: 15 }} />
        <LogoutButton onLogout={close} />
      </div>
    </ReactModal>
  );
};
