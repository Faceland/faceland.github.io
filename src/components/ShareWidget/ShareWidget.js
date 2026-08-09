import React, { useEffect, useRef, useState } from 'react';
import './shareWidget.scss';

const ShareIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width="18"
    height="18"
    aria-hidden="true"
  >
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
  </svg>
);

// Last resort for browsers that withhold the async clipboard (non-secure
// origins, older Safari). The URL is in the address bar either way, so a
// failure here is silent rather than loud.
const fallbackCopy = (text) => {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.top = '-1000px';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    // nothing more to try
  }
  document.body.removeChild(field);
};

const copyToClipboard = (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    return;
  }
  fallbackCopy(text);
};

/**
 * Slides a "copy this link" prompt up from the bottom-left corner whenever the
 * page has something new worth sharing, then retracts itself once the visitor
 * takes it. Parents drive it with `trigger`: bump the number on every change
 * that alters the shareable URL, or set it to 0 when there is nothing to share.
 */
export const ShareWidget = ({ label, trigger }) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const hideTimeout = useRef(null);
  const resetTimeout = useRef(null);

  useEffect(() => {
    clearTimeout(hideTimeout.current);
    clearTimeout(resetTimeout.current);

    if (!trigger) {
      setVisible(false);
      return;
    }

    setCopied(false);
    setVisible(true);
  }, [trigger]);

  useEffect(
    () => () => {
      clearTimeout(hideTimeout.current);
      clearTimeout(resetTimeout.current);
    },
    [],
  );

  const handleClick = () => {
    if (copied) return;

    copyToClipboard(window.location.href);
    setCopied(true);

    // Hold "Copied!" long enough to read, slide away, and only swap the label
    // back once the prompt is off-screen so it never flips mid-slide.
    hideTimeout.current = setTimeout(() => setVisible(false), 1200);
    resetTimeout.current = setTimeout(() => setCopied(false), 1700);
  };

  return (
    <div className={`shareContainer${visible ? ' shareVisible' : ''}`}>
      <button
        type="button"
        className={`shareButton${copied ? ' shareCopied' : ''}`}
        onClick={handleClick}
        disabled={!visible || copied}
        tabIndex={visible && !copied ? 0 : -1}
        aria-hidden={!visible}
        aria-label={copied ? 'Link copied to clipboard' : `${label}: copy link`}
      >
        <span className="shareLabel">{copied ? 'Copied!' : label}</span>
        <ShareIcon />
      </button>
    </div>
  );
};
