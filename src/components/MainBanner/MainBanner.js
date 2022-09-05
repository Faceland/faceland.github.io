import React, {useContext} from "react";
import './mainBanner.scss'
import {CopyWidget} from "../CopyWidget/CopyWidget";
import {Context} from '../../Store'

export const MainBanner = () => {

    const [state] = useContext(Context);

    return (
        <div className="mainBanner" style={state.mobile ? {marginTop: '50px'} : {marginTop: '0'}}>
            <video className="videoBg" style={state.mobile ? {top: '50px'} : {top: '0'}} playsInline autoPlay muted loop
                   src="https://1.filedit.ch/1/waXqaAyZpqVcrDfyjoSg.mp4"
                   poster="https://i.imgur.com/WMtrkuV.png"
            >
                background video
            </video>
            <div className={state.mobile ? "mobileTitle" : "desktopTitle"}>
                <img src="https://i.imgur.com/AtRhZD2.png" alt="Website Img"/>
                <div style={{position: "relative", top: '-10%'}}>
                    <CopyWidget copyText="PLAY.FACE.LAND"/>
                </div>
            </div>
        </div>
    )

}