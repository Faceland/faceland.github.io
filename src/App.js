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
import {Map} from "./pages/Map/Map";

function App() {
  // Handle discord subdomain, redirect to invite
  let host = window.location.host;
  let parts = host.split(".");
  if (parts.length >= 2) {
    if (parts[0] === "discord") {
      window.location.href = 'https://discord.gg/VUkE7Db4a8';
      return <div>Redirecting To Discord...</div>
    }
  }
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
          <Route path="/map">
            <Map/>
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
      <div className="basicPage pixelImage"
           style={{marginTop: "50px", backgroundImage: "url(https://i.imgur.com/qiV4xVw.png)", backgroundSize: 128}}>
        <ShuffleCollection/>
      </div>
      <DiscordWidget/>
      <Footer/>
    </div>
  )
}

export default App;
