'use strict';

import React, { useState } from 'react';
import { SketchPicker } from 'react-color';

export const ColorPickerPopout = (props) => {
  const [displayPicker, setDisplayPicker] = useState(false);

  const handleChange = (color) => {
    props.changeColor(color);
  };

  const handleClick = () => {
    setDisplayPicker(!displayPicker);
  };

  const handleClose = () => {
    setDisplayPicker(false);
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
    },
    popover: {
      position: 'absolute',
      zIndex: '20000',
    },
    cover: {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    },
  };

  return (
    <button onClick={() => {}}>
      {props.layer.color && (
        <>
          <div style={styles.swatch} onClick={handleClick}>
            <div style={styles.color} />
          </div>
          {displayPicker ? (
            <div style={styles.popover}>
              <div style={styles.cover} onClick={handleClose} />
              <SketchPicker
                color={props.layer.color.rgb}
                onChange={handleChange}
              />
            </div>
          ) : null}
        </>
      )}
    </button>
  );
};
