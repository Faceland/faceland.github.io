import React, {useContext, useEffect, useState, useRef, useCallback} from "react";
import {HeaderBar} from "../../components/HeaderBar/HeaderBar";
import {Context} from "../../Store";
import './portrait.scss'
import {v4 as uuidv4} from 'uuid';
import Modal from 'react-modal';
import {DragContainer} from "./DragContainer";
import {Scrollbars} from 'react-custom-scrollbars';
import {ImageRenderer} from "../../components/Portrait/ImageRenderer";

export const Portrait = (props) => {

  const scrollBar = useRef();
  const [state] = useContext(Context);
  const [layerItems, setLayerItems] = useState([]);
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [copyText, setCopyText] = React.useState(false);

  // a little function to help us with reordering the result
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(layerItems);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setLayerItems(result)
  };

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    reorder(layerItems, result.source.index.result.destination.index)
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
    layer.color = "#ffffff"
    layer.texture = null
    layer.configId = null
    const newArray = layerItems.slice()
    newArray.unshift(layer)
    setLayerItems(newArray)
    scrollBar.current.scrollToTop()
  }

  const updateLayers = () => {
    setLayerItems([...layerItems])
  }

  const deleteLayer = (layer) => {
    setLayerItems(layerItems.filter((loopLayer) => {
      return loopLayer.id !== layer.id
    }));
  }

  const buildConfigOutput = () => {
    return (
      <>
        <div className={"preserve-whitespace"}>npc-id-here:</div>
        <div className={"preserve-whitespace"}>   prebuilt-colors: []</div>
        <div className={"preserve-whitespace"}>   layers:</div>
        {layerItems.map((item, index) => {
            if (item.configId) {
              const colorData = item.color.toUpperCase() === "#FFFFFF" ? "" : "," + item.color.toUpperCase()
              return (<div className={"preserve-whitespace"} key={index}>   - "{item.configId}{colorData}"</div>)
            }
          }
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
              <ImageRenderer
                canvas={{height: 52, width: 52, renderer: 'P2D'}}
                layers={layerItems}
              />
            </div>
          </div>
          <div className={"listZone"}>
            <Scrollbars ref={scrollBar}>
              <DragContainer
                layers={layerItems}
                setLayers={setLayerItems}
                updateLayers={updateLayers}
                deleteLayer={deleteLayer}
              />
              <div className="entryItem addBkg no-select" onClick={() => {
                addNewLayer();
              }}><p>+</p></div>
            </Scrollbars>
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
    </div>
  );
}