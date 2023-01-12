import React, {useContext} from "react";
import {HeaderBar} from "../../components/HeaderBar/HeaderBar";
import {Footer} from "../../components/Footer/Footer";
import {Context} from "../../Store";
import {DiscordWidget} from "../../components/DiscordWidget/DiscordWidget"
import './guide.scss'
import {
    Accordion,
    AccordionItem,
    AccordionItemButton,
    AccordionItemHeading,
    AccordionItemPanel
} from "react-accessible-accordion";

export const Vote = (props) => {

    const [state] = useContext(Context);

    return (
        <div className="App Guide">
            <HeaderBar fancy={false}/>
            <div className="basicPage">
                <div style={{
                    maxWidth: '100%',
                    display: "flex",
                    height: 400,
                    justifyContent: "center",
                    overflow: "hidden"
                }}>
                    <img style={{display: "block", width: '100vw', height: '100%', objectFit: "cover"}}
                         src="https://i.imgur.com/q5Czwlv.jpg" alt="info background"/>
                </div>
                <div className="infoBanner shadow-normal">
                    <p>Vote for Faceland!</p>
                    <p>Rewards reset on the first of every month!</p>
                    <p>Be sure to login to collect rewards!</p>
                </div>
                <div style={{
                    maxWidth: '100%',
                    display: "flex",
                    justifyContent: "center",
                    padding: 30,
                    flexWrap: "wrap",
                    backgroundColor: "black"
                }}>
                    <div style={{ backgroundColor: "gray", margin: 10, padding: 20, borderRadius: 6 }}>
                        <a href="https://minecraft-mp.com/server-s314207" target="_blank"><img src="https://minecraft-mp.com/banner-314207.png" border="0"/></a>
                    </div>
                    <div style={{ backgroundColor: "gray", margin: 10, padding: 20, borderRadius: 6 }}>
                        <a href="https://minecraft-mp.com/server-s314207" target="_blank"><img src="https://minecraft-mp.com/banner-314207.png" border="0"/></a>
                    </div>
                    <div style={{ backgroundColor: "gray", margin: 10, padding: 20, borderRadius: 6 }}>
                        <a href="https://minecraft-mp.com/server-s314207" target="_blank"><img src="https://minecraft-mp.com/banner-314207.png" border="0"/></a>
                    </div>
                    <div style={{ backgroundColor: "gray", margin: 10, padding: 20, borderRadius: 6 }}>
                        <a href="https://minecraft-mp.com/server-s314207" target="_blank"><img src="https://minecraft-mp.com/banner-314207.png" border="0"/></a>
                    </div>
                    <div style={{ backgroundColor: "gray", margin: 10, padding: 20, borderRadius: 6 }}>
                        <a href="https://minecraft-mp.com/server-s314207" target="_blank"><img src="https://minecraft-mp.com/banner-314207.png" border="0"/></a>
                    </div>
                    <div style={{ backgroundColor: "gray", margin: 10, padding: 20, borderRadius: 6 }}>
                        <a href="https://minecraft-mp.com/server-s314207" target="_blank"><img src="https://minecraft-mp.com/banner-314207.png" border="0"/></a>
                    </div>
                </div>
            </div>
            <DiscordWidget/>
            <Footer/>
        </div>
    );
}