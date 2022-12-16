/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import Select from 'react-select';
import {
  backgroundOptions,
  bodyTypes,
  categoryOption, clothesOptions,
  extraHair, eyeOptions,
  faceOptions, getOptions, getSelections,
  hairOptions,
  headwearOptions,
  mouthOptions,
  noseOptions, textureSelections
} from "./DropdownOptions";

export default (props) => {

  const selectStyle = {
    control: (provided, state) => ({
      ...provided,
      boxShadow: "none",
      border: state.isFocused && "none",
      borderWidth: '0px',
      borderRadius: '0px'
    }),
    menu: (provided, state) => ({
      ...provided,
      border: "none",
      boxShadow: "none",
      display: "block"
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused && "lightgray",
      color: state.isFocused && "black"
    })
  }

  return (
    <>
      <div className="categoryDropdown">
        <Select
          unstyled
          name="texture"
          options={getOptions()}
          defaultValue={props.layer.options || textureSelections[0].option}
          onChange={(ev) => {props.changeOptions(ev)}}
          styles={selectStyle}
          isSearchable={false}
          focusInputOnMenuOpen={false}
          components={{ DropdownIndicator:() => null, IndicatorSeparator:() => null }}
        />
      </div>
      <div className="textureDropdown">
        <Select
          name="texture"
          options={props.layer.options ? getSelections(props.layer.options) : getSelections(textureSelections[0].option)}
          onChange={(ev) => {props.changeTexture(ev)}}
          defaultValue={props.layer.selection}
          value={props.layer.selection}
          styles={selectStyle}
          isSearchable={false}
          focusInputOnMenuOpen={false}
          components={{ DropdownIndicator:() => null, IndicatorSeparator:() => null }}
        />
      </div>
    </>
  )
}