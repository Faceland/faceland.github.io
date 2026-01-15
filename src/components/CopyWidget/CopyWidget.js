import React, { useState } from 'react';
import './copyWidget.scss';
import '../Tooltip/tooltip.scss';

export const CopyWidget = (props) => {
  const [copyStatus, setCopyStatus] = useState('Click To Copy!');
  let timeout;

  const copyTransition = () => {
    timeout && clearTimeout(timeout);
    setCopyStatus('Copied!');
    timeout = setTimeout(() => {
      setCopyStatus('Click To Copy!');
    }, 2000);
  };

  return (
      <div>
        <div
            className="copyContainer theme-primary shadow-normal"
            onClick={() => {
              copyTransition();
              //navigator.clipboard.writeText(props.copyText);
              navigator.clipboard.writeText('beta.face.land');
            }}
            data-tooltip={copyStatus}
        >
          <div className="copyButton">
            <img src="/assets/copy.svg" alt="copy" style={{ height: '1em' }} />
            <div className="divider" />
            <p style={{marginTop: 0, marginBottom: 2}}>{props.copyText}</p>
          </div>
        </div>
        <p className="copyVersion">Version: 1.21.8+</p>
      </div>
  );
};
