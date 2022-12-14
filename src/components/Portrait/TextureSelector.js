/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import Select from 'react-select';
import {
  backgroundOptions,
  bodyTypes,
  categoryOption, clothesOptions,
  extraHair, eyeOptions,
  faceOptions,
  hairOptions,
  headwearOptions,
  mouthOptions,
  noseOptions
} from "./DropdownOptions";

export default (props) => {

  const getList = (value) => {
    switch (value) {
      case "headwearOptions":
        return headwearOptions;
      case "hairOptions":
        return hairOptions;
      case "extraHair":
        return extraHair;
      case "noseOptions":
        return noseOptions;
      case "eyeOptions":
        return eyeOptions;
      case "mouthOptions":
        return mouthOptions;
      case "faceOptions":
        return faceOptions;
      case "clothesOptions":
        return clothesOptions;
      case "bodyTypes":
        return bodyTypes;
      case "backgroundOptions":
        return backgroundOptions;
    }
  }

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
          options={categoryOption}
          defaultValue={props.layer.options || {value: "backgroundOptions", label: '🗺️'}}
          onChange={(ev) => {props.changeOptions(ev)}}
          styles={selectStyle}
        />
      </div>
      <div className="textureDropdown">
        <Select
          name="texture"
          options={props.layer.options ? getList(props.layer.options.value) : backgroundOptions}
          onChange={(ev) => {props.changeTexture(ev)}}
          defaultValue={props.layer.selection || null}
          value={props.layer.selection || null}
          styles={selectStyle}
        />
      </div>
    </>
  )
}