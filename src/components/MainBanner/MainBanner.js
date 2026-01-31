import React, { useContext, useState, useRef, useCallback } from 'react';
import './mainBanner.scss';
import { CopyWidget } from '../CopyWidget/CopyWidget';
import { Context } from '../../Store';
import { Picture } from '../Picture/Picture';

export const MainBanner = () => {
  const [state] = useContext(Context);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef(null);

  const triggerConfetti = useCallback(() => {
    const container = document.createElement('div');
    container.className = 'forb-confetti-container';
    document.body.appendChild(container);

    for (let i = 0; i < 200; i++) {
      const forb = document.createElement('img');
      forb.src = '/assets/forb.gif';
      forb.className = 'forb-confetti';

      // Random horizontal position
      const startX = Math.random() * 100;
      // Random rotation between -120 and +120 degrees
      const rotation = Math.random() * 240 - 120;
      // Random size between 25% and 150%
      const scale = 0.25 + Math.random() * 1.25;
      // Random fall duration between 1.5 and 4 seconds (faster = more gravity)
      const duration = 1.5 + Math.random() * 2.5;
      // Random delay for staggered start
      const delay = Math.random() * 2;
      // Random horizontal drift
      const drift = (Math.random() - 0.5) * 200;

      forb.style.cssText = `
        left: ${startX}%;
        transform: rotate(${rotation}deg) scale(${scale});
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        --drift: ${drift}px;
      `;

      container.appendChild(forb);
    }

    // Remove container after animations complete
    setTimeout(() => {
      container.remove();
    }, 12000);
  }, []);

  const handleLogoClick = () => {
    // Clear existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 5) {
      triggerConfetti();
      setClickCount(0);
    } else {
      // Reset click count after 2 seconds of no clicks
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 2000);
    }
  };

  return (
    <div
      className={`mainBanner ${state.vignette !== false ? 'with-vignette' : ''}`}
      style={state.mobile ? { marginTop: '50px' } : { marginTop: '0' }}
    >
      <video
        className="videoBg"
        playsInline
        autoPlay
        muted
        loop
        src="/assets/videos/hDTyol4.mp4"
        poster="/assets/images/yCr2iAD.jpg"
        crossOrigin="anonymous"
      >
        background video
      </video>
      <div className={state.mobile ? 'mobileTitle' : 'desktopTitle'}>
        <h1 className="sr-only">Faceland RPG - Free Minecraft MMORPG Server</h1>
        <Picture
          src="/assets/images/AtRhZD2.png"
          alt="Faceland RPG Logo"
          onClick={handleLogoClick}
        />
        <div style={{ position: 'relative', top: '-10%' }}>
          <CopyWidget copyText="BETA.FACE.LAND" />
        </div>
      </div>
    </div>
  );
};
