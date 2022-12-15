import React, {useContext, useEffect, useState, useRef} from "react";
import {HeaderBar} from "../../components/HeaderBar/HeaderBar";
import {Context} from "../../Store";
import './portrait.scss'
import {v4 as uuidv4} from 'uuid';
import Modal from 'react-modal';
import {DragContainer} from "./DragContainer";
import {Scrollbars} from 'react-custom-scrollbars';
import {ImageRenderer} from "../../components/Portrait/ImageRenderer";
import {defaultChoices} from "../../components/Portrait/DropdownOptions";
import {Footer} from "../../components/Footer/Footer";
import { useSearchParams } from "react-router-dom";

export const Portrait = (props) => {

  const [searchParams, setSearchParams] = useSearchParams();

  const [state] = useContext(Context);

  const [layerItems, setLayerItems] = useState([])
  const [modalIsOpen, setIsOpen] = useState(false);
  const [copyText, setCopyText] = useState(false);

  const scrollBar = useRef();

  useEffect(() => {
    setTimeout(() => {
      if (searchParams.get("data")) {
        setLayerItems([])
      } else {
        setLayerItems(defaultChoices)
      }
    }, 3);
  }, []);

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

  const addNewLayer = (color, options, selection) => {
    const uuid = uuidv4()
    const layer = {}
    layer.id = uuid
    layer.color = color
    layer.selection = selection
    layer.options = options
    const newArray = layerItems.slice()
    newArray.push(layer)
    setLayerItems(newArray)
    scrollBar.current.scrollToTop()
  }

  const updateLayers = () => {
    setLayerItems([...layerItems])
    //setSearchParams({ hello: "world"  });
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
        <div className={"preserve-whitespace"}> prebuilt-colors: []</div>
        <div className={"preserve-whitespace"}> layers:</div>
        {layerItems.map((layer, index) => {
            if (layer.selection.configId) {
              let colorData
              if (layer.color) {
                colorData = layer.color.hex.toUpperCase()
                colorData = colorData !== "#FFFFFF" ? colorData : ''
              } else {
                colorData = ''
              }
              return (<div className={"preserve-whitespace"} key={index}> - "{layer.selection.configId}{colorData}"</div>)
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
                addNewLayer(undefined, undefined, undefined);
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
      <Footer/>
    </div>
  );
}