/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import Select from 'react-select';
import {textureOptions} from "./DropdownOptions";

export default (props) => (
    <Select
      name="texture"
      options={textureOptions}
      onChange={(ev) => {
        console.log(ev)
        props.changeTexture(ev.value, ev.configId)
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
);