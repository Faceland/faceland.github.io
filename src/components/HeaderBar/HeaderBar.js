import React, {useState, useContext} from 'react';
import './headerBar.scss'
import {Link} from "react-router-dom";
import {Context} from "../../Store";

export const HeaderBar = (props) => {

    const [state] = useContext(Context);

    const [scrollStyle, setScrollStyle] = useState(props.fancy ? "transparent" : "solid")
    const [burgerOpen, setBurgerState] = useState(false);

    window.onscroll = function () {
        if (!props.fancy || state.mobile) return
        setScrollStyle(window.pageYOffset < 10 ? "transparent" : "solid");
    }

    const toggleBurger = () => {
        setBurgerState(!burgerOpen);
    }

    const burger = (
        <div className="burgerContainer" onClick={toggleBurger}>
            <div className="burgerNav">
                <Link to="/">Home</Link>
                <Link to="/guide">Guide</Link>
                <Link to="/vote">Vote</Link>
                <a href="http://199.127.61.235:8100/#Quest_world:27:0:893:506:0:0:0:0:perspective" target="_blank">Map</a>
                <Link to="/about">Items</Link>
                <Link to="/facepals">FacePals™</Link>
                <a href="https://discord.gg/VUkE7Db4a8" target="_blank">Discord</a>
                <a href="http://shop.face.land/category/336956" target="_blank">Buy Gems</a>
            </div>
        </div>
    )

    const mobileHeader = (
        <div className={`headerBar barStyle-solid`}>
            <div className="logo mx-1">
                <Link className="logoButton" to="/">
                    <img src="https://i.imgur.com/u57KsyA.png" alt="Website Img"/>
                </Link>
                <div/>
            </div>
            <div>
                <i className="fa fa-bars" onClick={toggleBurger}/>
            </div>
        </div>
    )

    const desktopHeader = (
        <div className={`headerBar barStyle-${scrollStyle} shadow-normal`}>
            <div className="logo mx-1">
                <Link to="/" alt="FACELAND ARE PEE GEE CLICK 2 GO HOME">
                    <img className="logoButton" src="https://i.imgur.com/u57KsyA.png" alt="Website Img"/>
                </Link>
                <div/>
                <Link className="navButton" to="/">Home</Link>
                <Link className="navButton" to="/guide">Guide</Link>
                <Link className="navButton" to="/vote">Vote</Link>
                <a className="navButton" href="http://199.127.61.235:8100/#Quest_world:27:0:893:506:0:0:0:0:perspective" target="_blank">Map</a>
                <Link className="navButton" to="/about">Items</Link>
                <Link className="navButton" to="/facepals">FacePals™</Link>
                <a className="navButton" href="https://discord.gg/VUkE7Db4a8" target="_blank">Discord</a>
            </div>
            <div className="profileSection">
                <a className="gemButton" href="http://shop.face.land/category/336956" target="_blank">
                    <div className="gemDisplay">
                        <p>Buy FaceGems!</p><img src="https://i.imgur.com/AjRWtUR.png" alt="gem icon"/>
                    </div>
                </a>
            </div>
        </div>
    )

    return (
        <div>
            {state.mobile ? mobileHeader : desktopHeader}
            {(!props.fancy || state.mobile) && (<div style={{marginBottom: 50}}/>)}
            {burgerOpen ? burger : null}
        </div>
    )
}