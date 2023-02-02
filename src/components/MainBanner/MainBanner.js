import React, {useContext} from "react";
import './mainBanner.scss'
import {CopyWidget} from "../CopyWidget/CopyWidget";
import {Context} from '../../Store'

export const MainBanner = () => {

    const [state] = useContext(Context);

    return (
        <div className="mainBanner" style={state.mobile ? {marginTop: '50px'} : {marginTop: '0'}}>
            <img className="videoBg blur" src="https://i.imgur.com/6NU5DFz.jpg" alt="videoPoster"/>
            <video className="videoBg" style={state.mobile ? {top: '50px'} : {top: '0'}} playsInline autoPlay muted loop
                   src="https://m1.afileditch.ch/OXtYaxrZhXWFaKsmXKWg.mp4"
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