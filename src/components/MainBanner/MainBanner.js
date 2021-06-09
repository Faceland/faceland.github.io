import React, {useContext} from "react";
import './mainBanner.scss'
import {CopyWidget} from "../CopyWidget/CopyWidget";
import {Context} from '../../Store'

export const MainBanner = () => {

    const [state] = useContext(Context);

    return (
        <div className="mainBanner" style={state.mobile ? {marginTop: '50px'} : {marginTop: '0'}}>
            <video className="videoBg" style={state.mobile ? {top: '50px'} : {top: '0'}} playsInline autoPlay muted loop
                   src="https://down.loaded.ie/c9LqNmgf.mp4"
                   poster="https://www.wallpapertip.com/wmimgs/2-27681_minecraft-wallpaper-4k-pc.jpg"
            >
                background video
            </video>
            <div className={state.mobile ? "mobileTitle" : "desktopTitle"}>
                <img src="https://i.imgur.com/EOXkN9z.png" alt="Website Img"/>
                <div style={{position: "relative", top: '-10%'}}>
                    <CopyWidget copyText="PLAY.FACE.LAND"/>
                </div>
            </div>
        </div>
    )

}