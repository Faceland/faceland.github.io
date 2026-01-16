/* eslint-disable import/no-anonymous-default-export */
import React, { useState } from 'react';
import Select from 'react-select';

import {
  getOptions,
  getSelections,
  textureSelections,
} from './DropdownOptions';

const CategoryWheel = ({ options, selectedOption, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentOption = selectedOption || options[0];

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const wheelStyles = {
    container: {
      position: 'relative',
      width: '52px',
      height: '38px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerButton: {
      width: '38px',
      height: '38px',
      borderRadius: '50%',
      border: 'none',
      background: isOpen ? '#5a8fd8' : '#fff',
      cursor: 'pointer',
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: isOpen ? 10001 : 1,
      position: 'relative',
      transition: 'transform 0.1s ease, background 0.1s ease',
      transform: isOpen ? 'scale(1.1)' : 'scale(1)',
      boxShadow: isOpen ? '0 0 15px rgba(255,255,255,0.5)' : 'none',
      paddingLeft: '2px',
      paddingBottom: '1px',
    },
    optionsContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10000,
      pointerEvents: isOpen ? 'auto' : 'none',
    },
    option: (index, total) => {
      const angle = (index * (360 / total) - 90) * (Math.PI / 180);
      const radius = 50;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: 'none',
        background: '#fff',
        cursor: 'pointer',
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isOpen ? 1 : 0,
        transition: `opacity 0.1s ease ${index * 0.015}s, transform 0.1s ease ${index * 0.015}s`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      };
    },
    backdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
    },
  };

  const otherOptions = options.filter(opt => opt.value !== currentOption.value);

  return (
    <div style={wheelStyles.container} onClick={(e) => e.stopPropagation()}>
      {isOpen && <div style={wheelStyles.backdrop} onClick={() => setIsOpen(false)} />}
      <button
        style={wheelStyles.centerButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentOption.label}
      </button>
      <div style={wheelStyles.optionsContainer}>
        {otherOptions.map((option, index) => (
          <button
            key={option.value}
            style={wheelStyles.option(index, otherOptions.length)}
            onClick={() => handleSelect(option)}
            title={option.value.replace('Options', '').replace(/([A-Z])/g, ' $1').trim()}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default (props) => {
  const selectStyle = {
    control: (provided, state) => ({
      ...provided,
      boxShadow: 'none',
      border: state.isFocused && 'none',
      borderWidth: '0px',
      borderRadius: '0px',
    }),
    menu: (provided, state) => ({
      ...provided,
      border: 'none',
      boxShadow: 'none',
      display: 'block',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused && 'lightgray',
      color: state.isFocused && 'black',
    }),
  };

  return (
    <>
      <div className="categoryDropdown">
        <CategoryWheel
          options={getOptions()}
          selectedOption={props.layer.options || textureSelections[0].option}
          onChange={(ev) => {
            props.changeOptions(ev);
          }}
        />
      </div>
      <div className="textureDropdown">
        <Select
          name="texture"
          options={
            props.layer.options
              ? getSelections(props.layer.options)
              : getSelections(textureSelections[0].option)
          }
          onChange={(ev) => {
            props.changeTexture(ev);
          }}
          defaultValue={props.layer.selection}
          value={props.layer.selection}
          styles={selectStyle}
          isSearchable={false}
          focusInputOnMenuOpen={false}
          components={{
            DropdownIndicator: () => null,
            IndicatorSeparator: () => null,
          }}
        />
      </div>
    </>
  );
};
