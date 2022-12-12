import React, {useContext, useEffect, useState, useRef, useCallback} from "react";
import {HeaderBar} from "../../components/HeaderBar/HeaderBar";
import {Context} from "../../Store";
import './portrait.scss'
import {v4 as uuidv4} from 'uuid';
import Modal from 'react-modal';
import {DragContainer} from "./DragContainer";
import {ImageTint} from "../../components/Portrait/ImageTint";
import {Scrollbars} from 'react-custom-scrollbars';

export const Portrait = (props) => {

  const scrollBar = useRef();
  const [state] = useContext(Context);
  const [cardItems, setCardItems] = useState([]);
  const [layerStack, setLayerStack] = useState();
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [copyText, setCopyText] = React.useState(false);

  useEffect(() => {
    rebuildLayers(cardItems)
  }, [cardItems]);

  // a little function to help us with reordering the result
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(cardItems);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setCardItems(result)
  };

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    reorder(cardItems, result.source.index.result.destination.index)
  }

  const rebuildLayers = () => {
    console.log("rebuild")
    setLayerStack([])
    setTimeout(() => {
      setLayerStack(cardItems.map((layer, index) =>
          layer.texture !== null &&
          <>
            <ImageTint
              className="tintedIcon pixelImage"
              canvas={{height: 52, width: 52, renderer: 'P2D'}}
              tint={layer.color}
              src={layer.texture}
              draggable="false"
            />
          </>
        )
      )
    }, 5);
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
    scrollBar.current.scrollToBottom()
  }

  const updateLayers = () => {
    setCardItems([...cardItems])
  }

  const deleteLayer = (layer) => {
    setCardItems(cardItems.filter((loopLayer) => {
      return loopLayer.id !== layer.id
    }));
  }

  const buildConfigOutput = () => {
    return (
      <>
        <div className={"preserve-whitespace"}>npc-id-here:</div>
        <div className={"preserve-whitespace"}> prebuilt-colors: []</div>
        <div className={"preserve-whitespace"}> layers:</div>
        {cardItems.map((item, index) =>
          <div className={"preserve-whitespace"} key={index}> - "{item.configId},{item.color.toUpperCase()}"</div>
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
            <Scrollbars ref={scrollBar}>
              <DragContainer
                layers={cardItems}
                setLayers={setCardItems}
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