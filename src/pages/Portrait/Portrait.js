import React, { useContext, useEffect, useState, useRef } from 'react';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { Context } from '../../Store';
import './portrait.scss';
import { v4 as uuidv4 } from 'uuid';
import Modal from 'react-modal';
import { Scrollbars } from 'react-custom-scrollbars';
import { ImageRenderer } from '../../components/Portrait/ImageRenderer';
import {
  defaultChoices,
  getDataFromConfigId,
} from '../../components/Portrait/DropdownOptions';
import { useSearchParams } from 'react-router-dom';
import { DragContainer } from './DragContainer';
import { Footer } from '../../components/Footer/Footer';
import { SEO } from '../../components/SEO/SEO';

export const Portrait = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [state] = useContext(Context);

  const [layerItems, setLayerItems] = useState([]);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [copyText, setCopyText] = useState(false);

  const scrollBar = useRef();

  useEffect(() => {
    setTimeout(
      () => {
        if (searchParams.get('data')) {
          setLayerItems(parseQueryData(searchParams.get('data')));
        } else {
          setLayerItems(defaultChoices);
        }
      },
      state.mobile ? 500 : 100,
    );
  }, []);

  useEffect(() => {
    buildQueryData(layerItems);
  }, [layerItems]);

  const buildQueryData = (layerItems) => {
    let dataLayers = [];
    for (let l of layerItems) {
      if (l.selection) {
        dataLayers.push(
          l.selection.configId +
            (l.color ? '_' + l.color.hex.replace('#', '') : '_FFFFFF'),
        );
      }
    }
    if (dataLayers.length === 0) {
      setSearchParams({});
    } else {
      setSearchParams({ data: dataLayers.join('~') });
    }
  };

  const parseQueryData = (data) => {
    const newLayerItems = [];
    const layers = data.split('~');
    for (let l of layers) {
      let color = {};
      let configId;
      const layerAndColor = l.split('_');
      configId = layerAndColor[0];
      if (layerAndColor.length === 1) {
        color.hex = '#FFFFFF';
      } else {
        color.hex = '#' + layerAndColor[1];
      }
      color.rgb = hexToRgba(color.hex);
      const selectionData = getDataFromConfigId(configId);
      newLayerItems.push(
        createLayer(color, selectionData.option, selectionData.selection),
      );
    }
    return newLayerItems;
  };

  const hexToRgba = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
          a: 1,
        }
      : { r: 255, g: 255, b: 255, a: 1 };
  };

  const openModal = () => {
    setIsOpen(true);
    setCopyText(buildConfigOutput);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const modalStyle = {
    overlay: {
      backgroundColor: 'transparent',
      zIndex: 200,
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

  const createLayer = (color, options, selection) => {
    return {
      id: uuidv4(),
      color: color,
      selection: selection,
      options: options,
    };
  };

  const addNewLayer = (color, options, selection) => {
    const layer = createLayer(color, selection, options);
    const newArray = layerItems.slice();
    newArray.push(layer);
    setLayerItems(newArray);
    setTimeout(() => {
      scrollBar.current.view.scroll({
        top: 1000000,
        behavior: 'smooth',
      });
    }, 10);
  };

  const updateLayers = () => {
    setLayerItems([...layerItems]);
  };

  const deleteLayer = (layer) => {
    setLayerItems(
      layerItems.filter((loopLayer) => {
        return loopLayer.id !== layer.id;
      }),
    );
  };

  const buildConfigOutput = () => {
    return (
      <>
        <div className={'preserve-whitespace'}>npc-id-here:</div>
        <div className={'preserve-whitespace'}> prebuilt-colors: []</div>
        <div className={'preserve-whitespace'}> layers:</div>
        {layerItems.map((layer, index) => {
          if (layer.selection && layer.selection.configId) {
            let colorData;
            if (layer.color) {
              colorData = layer.color.hex.toUpperCase();
              colorData = colorData !== '#FFFFFF' ? ',' + colorData : '';
            } else {
              colorData = '';
            }
            return (
              <div className={'preserve-whitespace'} key={index}>
                {' '}
                - "{layer.selection.configId}
                {colorData}"
              </div>
            );
          }
        })}
      </>
    );
  };

  const modal = (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={modalStyle}
      contentLabel="npc copypasta"
    >
      {copyText}
    </Modal>
  );

  const desktopLayout = (
    <div className="basicPage">
      <div className={'palsBox'}>
        <div className={'imageZone'}>
          <button className={'modal-button'} onClick={openModal}>
            🤓
          </button>
          <div className={'image'}>
            <ImageRenderer
              canvas={{ height: 52, width: 52, renderer: 'P2D' }}
              layers={layerItems}
            />
          </div>
        </div>
        <div className={'listZone'}>
          <Scrollbars
            ref={scrollBar}
            renderThumbVertical={({ style, ...props }) => (
              <div {...props} style={{ ...style, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: '3px', width: '6px' }} />
            )}
          >
            <DragContainer
              layers={layerItems}
              setLayers={setLayerItems}
              updateLayers={updateLayers}
              deleteLayer={deleteLayer}
            />
            <div
              className="entryItem addBkg no-select"
              onClick={() => {
                addNewLayer(
                  { hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255, a: 1 } },
                  undefined,
                  undefined,
                );
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </div>
          </Scrollbars>
        </div>
        {modal}
      </div>
      <Footer />
    </div>
  );

  const mobileLayout = (
    <div className="basicPage">
      <div className="mobileContainer">
        <div className="portraitContainer">
          <div className="mobileImageZone">
            <button className="modal-button" onClick={openModal}>
              🤓
            </button>
            <div className="image">
              <ImageRenderer
                canvas={{ height: 52, width: 52, renderer: 'P2D' }}
                layers={layerItems}
              />
            </div>
          </div>
        </div>
        <div className="listContainer">
          <Scrollbars
            ref={scrollBar}
            renderThumbVertical={({ style, ...props }) => (
              <div {...props} style={{ ...style, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: '3px', width: '6px' }} />
            )}
          >
            <DragContainer
              layers={layerItems}
              setLayers={setLayerItems}
              updateLayers={updateLayers}
              deleteLayer={deleteLayer}
            />
            <div
              className="entryItem addBkg no-select"
              onClick={() => {
                addNewLayer(
                  { hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255, a: 1 } },
                  undefined,
                  undefined,
                );
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </div>
          </Scrollbars>
          {modal}
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="App Portrait">
      <SEO
        title="FacePals Character Creator"
        description="Create custom NPC portraits for Faceland! Design unique characters with our FacePals portrait creator tool. Layer different features, colors, and styles."
      />
      <HeaderBar fancy={false} />
      <h1 className="sr-only">FacePals Character Creator - Design Custom NPC Portraits</h1>
      {state.mobile ? mobileLayout : desktopLayout}
    </div>
  );
};
