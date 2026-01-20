import React, { useState, useRef } from 'react';
import './copyWidget.scss';

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
  </svg>
);

export const CopyWidget = () => {
  const [tooltipText, setTooltipText] = useState('Click To Copy!');
  const timeoutRef = useRef(null);

  const handleClick = () => {
    navigator.clipboard.writeText('BETA.FACE.LAND');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setTooltipText('Copied!');

    timeoutRef.current = setTimeout(() => {
      setTooltipText('Click To Copy!');
    }, 2000);
  };

  return (
    <div className="copyWidgetWrapper">
      <div
        className="copyContainer"
        onClick={handleClick}
      >
        <div className="tooltip">
          <span className="tooltipText">{tooltipText}</span>
          <span className="tooltipArrow" />
        </div>
        <div className="copyContent">
          <CopyIcon />
          <span className="divider" />
          <span className="copyText">BETA.FACE.LAND</span>
        </div>
      </div>
      <p className="copyVersion">Minecraft Version: 1.21.8+</p>
    </div>
  );
};
