/* eslint-disable import/no-anonymous-default-export */
import React, {useState} from 'react';
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

  const [texture, setTexture] = useState();
  const [options, setOptions] = useState(headwearOptions);

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

  return (
    <>
      <div className="categoryDropdown">
        <Select
          unstyled
          name="texture"
          options={categoryOption}
          defaultValue={{ value: "headwearOptions", label: '🎩' }}
          onChange={(ev) => {
            console.log(ev)
            setOptions(getList(ev.value))
            setTexture(null)
            props.changeTexture(null, null)
          }}
          styles={{
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
          }}
        />
      </div>
      <div className="textureDropdown">
        <Select
          name="texture"
          options={options}
          onChange={(ev) => {
            console.log(ev)
            setTexture(ev)
            props.changeTexture(ev.value, ev.configId)
          }}
          value={texture}

          styles={{
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
          }}
        />
      </div>
    </>
  )
}