import React, { useState, useContext } from 'react';
import './headerBar.scss';
import { Link } from 'react-router-dom';
import { Context } from '../../Store';
import { Picture } from '../Picture/Picture';

export const HeaderBar = (props) => {
  const [state] = useContext(Context);

  const [scrollStyle, setScrollStyle] = useState(
    props.fancy ? 'transparent' : 'solid',
  );
  const [burgerOpen, setBurgerState] = useState(false);

  window.onscroll = function () {
    if (!props.fancy || state.mobile) return;
    setScrollStyle(window.pageYOffset < 10 ? 'transparent' : 'solid');
  };

  const toggleBurger = () => {
    setBurgerState(!burgerOpen);
  };

  const burger = (
    <div className="burgerContainer" onClick={toggleBurger}>
      <div className="burgerNav">
        <Link to="/">Home</Link>
        <Link to="/guide">Guide</Link>
        <Link to="/vote">Vote</Link>
        <a
          href="http://199.127.61.235:8100/#Quest_world:27:0:893:506:0:0:0:0:perspective"
          target="_blank"
          rel="noopener noreferrer"
        >
          Map
        </a>
        <Link to="/items">Items</Link>
        <Link to="/facepals">FacePals™</Link>
        <a href="https://discord.gg/Gkmk6G2fjd" target="_blank" rel="noopener noreferrer">
          Discord
        </a>
        <a href="https://shop.face.land" target="_blank" rel="noopener noreferrer" className="buyGemsLink">
          Buy&nbsp;Gems
        </a>
      </div>
    </div>
  );

  const mobileHeader = (
    <div className={`headerBar barStyle-solid`}>
      <div className="logo mx-1">
        <Link className="logoButton" to="/">
          <Picture src="/assets/images/u57KsyA.png" alt="Faceland Logo" />
        </Link>
        <div />
      </div>
      <div>
        <i className="fa fa-bars" onClick={toggleBurger} />
      </div>
    </div>
  );

  const desktopHeader = (
    <div className={`headerBar barStyle-${scrollStyle} shadow-normal`}>
      <div className="logo mx-1">
        <Link to="/">
          <Picture
            className="logoButton"
            src="/assets/images/u57KsyA.png"
            alt="Faceland Logo"
          />
        </Link>
        <div />
        <Link className="navButton" to="/">
          <span className="navHover" />
          Home
        </Link>
        <Link className="navButton" to="/guide">
          <span className="navHover" />
          Guide
        </Link>
        <Link className="navButton" to="/vote">
          <span className="navHover" />
          Vote
        </Link>
        <a
          className="navButton"
          href="http://199.127.61.235:8100/#Quest_world:27:0:893:506:0:0:0:0:perspective"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="navHover" />
          Map
        </a>
        <Link className="navButton" to="/items">
          <span className="navHover" />
          Items
        </Link>
        <Link className="navButton" to="/facepals">
          <span className="navHover" />
          FacePals™
        </Link>
        <a
          className="navButton"
          href="https://discord.gg/Gkmk6G2fjd"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="navHover" />
          Discord
        </a>
      </div>
      <div className="profileSection h-fit">
        <a
          className="facegemButton m-2 bg-gradient-to-b from-purple-300 to-purple-600 px-4"
          href="https://shop.face.land"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="flex items-center whitespace-nowrap font-bold text-white">
            <p>Buy FaceGems!</p>
            <Picture
              src="/assets/images/XAhGG80.png"
              alt="FaceGem icon"
              className="gemImg speed-2 m-1 ml-2 mr-0 h-8"
            />
          </div>
        </a>
      </div>
    </div>
  );

  return (
    <div>
      {state.mobile ? mobileHeader : desktopHeader}
      {(!props.fancy || state.mobile) && <div style={{ marginBottom: 50 }} />}
      {burgerOpen ? burger : null}
    </div>
  );
};
