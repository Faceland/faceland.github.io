import React from 'react';
import Select from 'react-select';

const options = [
  { value: 'https://i.imgur.com/W79LA7v.png', configId: "hair1", label: 'Afro' },
  { value: 'https://i.imgur.com/LeSlGRW.png', configId: "hair1", label: 'Hair1' },
  { value: 'https://i.imgur.com/ZJ0mJ87.png', configId: "hair1", label: 'Hair2' },
  { value: 'https://i.imgur.com/ZJ0mJ87.png', configId: "hair1", label: 'Hair2' },
  { value: 'https://i.imgur.com/ZJ0mJ87.png', configId: "hair1", label: 'Hair2' },
  { value: 'https://i.imgur.com/ZJ0mJ87.png', configId: "hair1", label: 'Hair2??' },
  { value: 'https://i.imgur.com/ZJ0mJ87.png', configId: "hair1", label: 'Hair2????' },
  { value: 'https://i.imgur.com/ZJ0mJ87.png', configId: "hair1", label: 'Hair3jk2' }
]

export default (props) => (
  <Select
    name="texture"
    options={options}
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
        boxShadow: "none"
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused && "lightgray",
        color: state.isFocused && "black"
      })
    }}
  />
);