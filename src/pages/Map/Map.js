import React, {useContext} from "react";
import {HeaderBar} from "../../components/HeaderBar/HeaderBar";
import {Context} from "../../Store";
import {DiscordWidget} from "../../components/DiscordWidget/DiscordWidget"
import './map.scss'
import {Footer} from "../../components/Footer/Footer";

export const Map = (props) => {

  const [state] = useContext(Context);

  function MouseOver(event) {
    parent.window.document.body.style.overflow = 'hidden';
  }

  function MouseOut(event) {
    parent.window.document.body.style.overflow = '';
  }

  return (
    <div className="App Map">
      <HeaderBar fancy={false}/>
      <div className="basicPage">
        <div className="mapContainer" onMouseOver={MouseOver} onMouseOut={MouseOut}>
          <iframe className="mapContent" scrolling="no"
                  src="http://199.127.61.235:8100/#Quest_world:27:0:893:506:0:0:0:0:perspective" title="sneed"/>
        </div>
      </div>
      <DiscordWidget/>
      <Footer/>
    </div>
  );

}