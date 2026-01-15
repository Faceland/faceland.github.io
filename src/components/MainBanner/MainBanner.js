import React, { useContext, useEffect, useRef } from 'react';
import './mainBanner.scss';
import { CopyWidget } from '../CopyWidget/CopyWidget';
import { Context } from '../../Store';

export const MainBanner = () => {
  const [state] = useContext(Context);
  return (
    <div
      className="mainBanner"
      style={state.mobile ? { marginTop: '50px' } : { marginTop: '0' }}
    >
      <video
        className="videoBg"
        style={state.mobile ? { top: '50px' } : { top: '0' }}
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
        <img src="/assets/images/AtRhZD2.png" alt="Website Img" />
        <div style={{ position: 'relative', top: '-10%' }}>
          <CopyWidget copyText="BETA.FACE.LAND" />
        </div>
      </div>
    </div>
  );
};
