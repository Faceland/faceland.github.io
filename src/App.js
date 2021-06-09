import './App.scss';

import React from 'react';
import {
    HashRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import Store from './Store'

import {HeaderBar} from "./components/HeaderBar/HeaderBar";
import {Footer} from "./components/Footer/Footer";
import {MobileStateHandler} from "./components/MobileStateHandler";
import {ShuffleCollection} from "./components/Shuffle/ShuffleCollection";
import {Home} from "./pages/Home/Home";
import {DiscordWidget} from "./components/DiscordWidget/DiscordWidget"
import {Guide} from "./pages/Guide/Guide";

function App() {

    return (
            <Router>
                <Store>
                    <MobileStateHandler/>
                    <Switch>
                        <Route path="/about">
                            <About/>
                        </Route>
                        <Route path="/guide">
                            <Guide/>
                        </Route>
                        <Route path="/">
                            <Home/>
                        </Route>
                    </Switch>
                </Store>
            </Router>
    );
}

function About() {
    return (
        <div className="App">
            <HeaderBar fancy={false}/>
            <div className="basicPage pixelImage" style={{marginTop: "50px", backgroundImage: "url(https://i.imgur.com/rb0H7eH.png)", backgroundSize: 64}}>
                <ShuffleCollection/>
            </div>
            <DiscordWidget/>
            <Footer/>
        </div>
    )
}

export default App;
