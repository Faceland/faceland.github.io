import React, {useContext, useEffect, useState} from "react";
import {HeaderBar} from "../../components/HeaderBar/HeaderBar";
import {Context} from "../../Store";
import {DiscordWidget} from "../../components/DiscordWidget/DiscordWidget"
import './portrait.scss'
import {Scrollbar} from 'react-scrollbars-custom';
import { v4 as uuidv4 } from 'uuid';
import ColorPickerPopout from "../../components/Portrait/ColorPickerPopout";
import TextureSelector from "../../components/Portrait/TextureSelector";
import IconTint from 'react-icon-tint';
import Modal from 'react-modal';

export const Portrait = (props) => {

  const [state] = useContext(Context);
  const [cardItems, setCardItems] = useState([]);
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [copyText, setCopyText] = React.useState(false);

  const openModal = () => {
    setIsOpen(true)
    setCopyText(buildConfigOutput)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  const modalStyle = {
    overlay: {
      backgroundColor: 'transparent'
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      padding: '100px',
      backgroundColor: 'black',
      color: 'green',
      borderColor: 'green',
      transform: 'translate(-50%, -50%)',
    },
  };

  const addNewLayer = () => {
    const uuid = uuidv4()
    const layer = {}
    layer.id = uuid
    layer.color = "#5DBDEC"
    layer.texture = null
    layer.configId = null

    const newArray = cardItems.slice()
    newArray.push(layer)
    console.log("new uuid: " + uuid)
    setCardItems(newArray)
  }

  const buildConfigOutput = () => {
    return (
      <>
        <div className={"preserve-whitespace"}>npc-id-here:</div>
        <div className={"preserve-whitespace"}>  prebuilt-colors: []</div>
        <div className={"preserve-whitespace"}>  layers:</div>
        {cardItems.map((item, index) =>
          <div className={"preserve-whitespace"} key={index}>  - "{item.configId},{item.color.toUpperCase()}"</div>
        )}
      </>
    )
  }

  return (
    <div className="App Portrait">
      <HeaderBar fancy={false}/>
      <div className="basicPage">
        <div className={"palsBox"}>
          <div className={"imageZone"}>
            <button className={"modal-button"} onClick={openModal}>🤓</button>
            <div className={"image"}>
              {cardItems.map((item, index) =>
                item.texture !== null &&
                <>
                  <IconTint className="pixelImage tintedIcon" src={item.texture} color={item.color} alt="" draggable="false"/>
                  <img className="pixelImage tintedIcon fade" src={item.texture} alt="" draggable="false"/>)
                </>
              )}
            </div>
          </div>
          <div className={"listZone"}>
            <Scrollbar>
              {cardItems.map((item, index) =>
                <div className="entryItem itemBkg no-select" key={item.id}>
                  <ColorPickerPopout changeColor={(newColor) => {
                    item.color = newColor
                    setCardItems([...cardItems])
                  }}/>
                  <div className="selectContainer">
                    <TextureSelector changeTexture={(newTexture, configId) => {
                      item.texture = newTexture
                      item.configId = configId
                      setCardItems([...cardItems])
                    }}/>
                  </div>
                  <div className="delete" onClick={() => {
                    setCardItems(cardItems.filter(loopItem => loopItem.id !== item.id))
                  }}>X</div>
                </div>
              )}
              <div className="entryItem addBkg no-select" onClick={addNewLayer}><p>+</p></div>
            </Scrollbar>;
          </div>
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            style={modalStyle}
            contentLabel="npc copypasta"
          >
            {copyText}
          </Modal>
        </div>
      </div>
      <DiscordWidget/>
    </div>
  );
}