import React, {useState, useContext} from 'react';
import './headerBar.scss'
import '../../App.scss'
import {Link} from "react-router-dom";
import {Context} from "../../Store";

export const HeaderBar = (props) => {

    const [state] = useContext(Context);

    const [scrollStyle, setScrollStyle] = useState({background: 'transparent'})
    const [burgerOpen, setBurgerState] = useState(false);

    window.onscroll = function () {
        if (!props.fancy || state.mobile) return
        setScrollStyle(window.pageYOffset < 10 ? {background: 'transparent'} : {background: 'white'});
    }

    const toggleBurger = () => {
        setBurgerState(!burgerOpen);
    }

    const burger = (
        <div className="burgerContainer" onClick={toggleBurger}>
            <div className="burgerNav">
                <Link to="/">Home</Link>
                <Link to="/guide">Guide</Link>
                <Link to="/about">Items</Link>
                <a href="https://faceland-rpg.craftingstore.net/category/247715" target="_blank">Buy Gems</a>
            </div>
        </div>
    )

    const mobileHeader = (
        <div className="headerBar" style={{background: 'white', transition: 'none'}}>
            <div className="logo mx-1">
                <Link to="/">
                    <img
                        src="https://i.imgur.com/FSMeukV.png"
                        alt="Website Img"/>
                </Link>
                <div/>
            </div>
            <div>
                <i className="fa fa-bars" onClick={toggleBurger}/>
            </div>
        </div>
    )

    const desktopHeader = (
        <div className="headerBar shadow-normal" style={props.fancy ? scrollStyle : {background: 'white'}}>
            <div className="logo mx-1">
                <Link to="/">
                    <img
                        src="https://i.imgur.com/FSMeukV.png"
                        alt="Website Img"/>
                </Link>
                <div/>
                <Link className="floatingButton theme-white" to="/">Home</Link>
                <Link className="floatingButton theme-white" to="/guide">Guide</Link>
                <Link className="floatingButton theme-white" to="/about">Items</Link>
            </div>
            <div className="profileSection">
                <a className="gemButton" href="https://faceland-rpg.craftingstore.net/category/247715" target="_blank">
                    <div className="gemDisplay">
                        <p>Buy FaceGems!</p><img src="https://i.imgur.com/Sy2kgca.png" alt="gem icon"/>
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