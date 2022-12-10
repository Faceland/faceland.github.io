import React, {useContext, useEffect, useState} from "react";
import {HeaderBar} from "../../components/HeaderBar/HeaderBar";
import {Context} from "../../Store";
import {DiscordWidget} from "../../components/DiscordWidget/DiscordWidget"
import './portrait.scss'
import {Scrollbar} from 'react-scrollbars-custom';
import { v4 as uuidv4 } from 'uuid';
import ColorPickerPopout from "../../components/Portrait/ColorPickerPopout";
import TextureSelector from "../../components/Portrait/TextureSelector";
import Modal from 'react-modal';
import {ImageTint} from "../../components/Portrait/ImageTint";

export const Portrait = (props) => {

  const [state] = useContext(Context);
  const [cardItems, setCardItems] = useState([]);
  const [layerStack, setLayerStack] = useState();
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [copyText, setCopyText] = React.useState(false);

  useEffect(() => {
    rebuildLayers(cardItems)
  }, [cardItems]);

  const rebuildLayers = () => {
    console.log("rebuild")
    setLayerStack(null)
    setLayerStack(
      cardItems.map((item, index) =>
        item.display !== null &&
        <>
          {item.display}
        </>
      )
    )
  }

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
    layer.display = null

    const newArray = cardItems.slice()
    newArray.push(layer)
    console.log("new uuid: " + uuid)
    setCardItems(newArray)
  }

  const buildTintObject = (layer) => {
    if (layer.texture == null) { return }
    layer.display = (
      <ImageTint
        className="tintedIcon pixelImage"
        canvas={{ height: 52, width: 52, renderer: 'P2D' }}
        tint={layer.color}
        src={layer.texture}
        draggable="false"
      />
    )
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
              {layerStack}
            </div>
          </div>
          <div className={"listZone"}>
            <Scrollbar>
              {cardItems.map((item, index) =>
                <div className="entryItem itemBkg no-select" key={item.id}>
                  <ColorPickerPopout changeColor={(newColor) => {
                    item.color = newColor
                    item.display = null;
                    setCardItems([...cardItems])
                    setTimeout(function() {
                      buildTintObject(item)
                      setCardItems([...cardItems])
                    }, 0);
                  }}/>
                  <div className="selectContainer">
                    <TextureSelector changeTexture={(newTexture, configId) => {
                      item.texture = newTexture
                      item.configId = configId
                      item.display = null;
                      setCardItems([...cardItems])
                      setTimeout(function() {
                        buildTintObject(item)
                        setCardItems([...cardItems])
                      }, 2);
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