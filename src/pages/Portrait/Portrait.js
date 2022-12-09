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

export const Portrait = (props) => {

  const [state] = useContext(Context);
  const [cardItems, setCardItems] = useState([]);

  useEffect(() => {


  }, [cardItems]);

  const addNewLayer = () => {
    console.log("seeddf")
    const uuid = uuidv4();
    const layer = {};
    layer.id = uuid;
    layer.color = "#5DBDEC"
    layer.texture = null;

    const newArray = cardItems.slice()
    newArray.push(layer)
    console.log("new uuid: " + uuid)
    setCardItems(newArray)
  }

  return (
    <div className="App Portrait">
      <HeaderBar fancy={false}/>
      <div className="basicPage">
        <div className={"palsBox"}>
          <div className={"imageZone"}>
            <div className={"image"}>
              {cardItems.map((item, index) =>
                item.texture !== null && <IconTint className="pixelImage tintedIcon" src={item.texture} color={item.color} alt=""/>
              )}
            </div>
          </div>
          <div className={"listZone"}>
            <Scrollbar>
              {cardItems.map((item, index) =>
                <div className="entryItem itemBkg no-select" key={item.id}>
                  <ColorPickerPopout changeColor={(newColor) => item.color = newColor}/>
                  <div className="selectContainer">
                    <TextureSelector changeTexture={(newTexture) => item.texture = newTexture}/>
                  </div>
                  <div className="delete" onClick={() => {
                    setCardItems(cardItems.filter(loopItem => loopItem.id !== item.id))
                  }}>X</div>
                </div>
              )}
              <div className="entryItem addBkg no-select" onClick={addNewLayer}><p>+</p></div>
            </Scrollbar>;
          </div>
        </div>
      </div>
      <DiscordWidget/>
    </div>
  );
}