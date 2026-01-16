'use strict';

import React, { useState, useRef, useEffect } from 'react';
import { SketchPicker } from 'react-color';

export const ColorPickerPopout = (props) => {
  const [verticalOffset, setVerticalOffset] = useState(0);
  const swatchRef = useRef(null);
  const pickerHeight = 300;

  const displayPicker = props.isOpen;

  useEffect(() => {
    if (displayPicker) {
      const handleScroll = () => props.onToggle(false);
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [displayPicker, props.onToggle]);

  const handleChange = (color) => {
    props.changeColor(color);
  };

  const getScrollableParent = (element) => {
    let parent = element.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      if (style.overflow === 'auto' || style.overflow === 'scroll' ||
          style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }
    return document.documentElement;
  };

  const handleClick = () => {
    if (!displayPicker && swatchRef.current) {
      const rect = swatchRef.current.getBoundingClientRect();
      const container = getScrollableParent(swatchRef.current);
      const containerRect = container.getBoundingClientRect();

      const spaceAbove = rect.top - containerRect.top;
      const spaceBelow = containerRect.bottom - rect.bottom;
      const threshold = 150;

      if (spaceBelow < threshold) {
        setVerticalOffset(-(threshold - spaceBelow));
      } else if (spaceAbove < threshold) {
        setVerticalOffset(threshold - spaceAbove);
      } else {
        setVerticalOffset(0);
      }
    }
    props.onToggle(!displayPicker);
  };

  const handleClose = () => {
    props.onToggle(false);
  };

  const styles = {
    color: {
      width: '28px',
      height: '28px',
      borderRadius: '2px',
      background: `rgba(${props.layer.color.rgb.r}, ${props.layer.color.rgb.g}, ${props.layer.color.rgb.b}, ${props.layer.color.rgb.a})`,
    },
    swatch: {
      padding: '5px',
      background: '#fff',
      borderRadius: '1px',
      marginLeft: '5px',
      cursor: 'pointer',
      ...(displayPicker && {
        animation: 'pickerGlow 0.8s ease-in-out infinite',
      }),
    },
    popover: {
      position: 'absolute',
      zIndex: '20001',
      left: '100%',
      top: '50%',
      transform: `translateY(calc(-50% + ${verticalOffset}px))`,
      marginLeft: '10px',
    },
    cover: {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
      zIndex: '20000',
    },
  };

  return (
    <button onClick={() => {}} style={{ position: 'relative' }}>
      {props.layer.color && (
        <>
          <div ref={swatchRef} style={styles.swatch} onClick={handleClick}>
            <div style={styles.color} />
          </div>
          {displayPicker ? (
            <>
              <div style={styles.cover} onClick={handleClose} />
              <div style={styles.popover}>
                <SketchPicker
                  color={props.layer.color.rgb}
                  onChange={handleChange}
                />
              </div>
            </>
          ) : null}
        </>
      )}
    </button>
  );
};
