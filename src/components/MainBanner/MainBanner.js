import React, {useContext, useEffect, useRef} from "react";
import './mainBanner.scss'
import {CopyWidget} from "../CopyWidget/CopyWidget";
import {Context} from '../../Store'

export const MainBanner = () => {

  const [state] = useContext(Context);
  const video = useRef();
  const videoCover = useRef();

  useEffect(() => {
    const destroyCover = () => {
      videoCover.current.classList.toggle("m-fadeOut");
    }
    video.current.addEventListener("loadeddata", destroyCover);
    return () => {
      video.current.removeEventListener('loadeddata', destroyCover);
    };
  }, [])

  return (
    <div className="mainBanner" style={state.mobile ? {marginTop: '50px'} : {marginTop: '0'}}>
      <video ref={video} className="videoBg" style={state.mobile ? {top: '50px'} : {top: '0'}} playsInline
             autoPlay muted loop src="https://m1.afileditch.ch/OXtYaxrZhXWFaKsmXKWg.mp4"
      >
        background video
      </video>
      <img ref={videoCover} className="videoBg blur fadeInOut" src="https://i.imgur.com/6NU5DFz.jpg" alt="videoPoster"/>
      <div className={state.mobile ? "mobileTitle" : "desktopTitle"}>
        <img src="https://i.imgur.com/AtRhZD2.png" alt="Website Img"/>
        <div style={{position: "relative", top: '-10%'}}>
          <CopyWidget copyText="PLAY.FACE.LAND"/>
        </div>
      </div>
    </div>
  )

}