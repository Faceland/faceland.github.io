import React, { useState } from 'react';
import { ReactComponent as CopyIcon } from '../../assets/copy.svg';
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
        <CopyIcon style={{ fill: 'whitesmoke' }} />
        <div className="divider" />
        <p style={{ marginTop: 0, marginBottom: 2 }}>{props.copyText}</p>
      </div>
    </div>
  );
};
