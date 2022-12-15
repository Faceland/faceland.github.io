'use strict'

import React, {useState} from 'react'
import reactCSS from 'reactcss'
import { SketchPicker } from 'react-color'

export const ColorPickerPopout = (props) => {

  const [displayPicker, setDisplayPicker] = useState(false)
  const [color, setColor] = useState(props.layer.color)

  const handleChange = (color) => {
    setColor(color)
    props.changeColor(color)
  };

  const handleClick = () => {
    setDisplayPicker(!displayPicker)
  };

  const handleClose = () => {
    setDisplayPicker(false)
  };

  const swatchStyleFallback = () => {
    if (color.rgb) {
      return color.rgb.r + "," + color.rgb.g + "," + + color.rgb.b + "," + 1
    } else {
      return "255,255,255,1"
    }
  }

  const styles = reactCSS({
    'default': {
      color: {
        width: '28px',
        height: '28px',
        borderRadius: '2px',
        background: `rgba(${swatchStyleFallback})`,
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
    },
  });

  return (
    <button onClick={()=>{}}>
      <div style={styles.swatch} onClick={handleClick}>
        <div style={styles.color}/>
      </div>
      {displayPicker ? <div style={styles.popover}>
        <div style={styles.cover} onClick={handleClose}/>
        <SketchPicker
          color={props.layer.color.rgb}
          onChange={handleChange}
        />
      </div> : null}
    </button>
  )
}