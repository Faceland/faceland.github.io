import './App.scss';
import './animations.scss';

import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Store from './Store';

import { HeaderBar } from './components/HeaderBar/HeaderBar';
import { Footer } from './components/Footer/Footer';
import { MobileStateHandler } from './components/MobileStateHandler';
import { ShuffleCollection } from './components/Shuffle/ShuffleCollection';
import { Home } from './pages/Home/Home';
import { DiscordWidget } from './components/DiscordWidget/DiscordWidget';
import { Guide } from './pages/Guide/Guide';
import { Portrait } from './pages/Portrait/Portrait';
import { Map } from './pages/Map/Map';
import { Vote } from './pages/Vote/Vote';
import { Embed } from './pages/Embed/Embed';

function App() {
  return (
    <Router>
      <Store>
        <MobileStateHandler />
        <Routes>
          <Route index element={<Home />} />
          <Route path="items" element={<About />} />
          <Route path="guide" element={<Guide />} />
          <Route path="vote" element={<Vote />} />
          <Route path="map" element={<Map />} />
          <Route path="facepals" element={<Portrait />} />
          <Route path="embed" element={<Embed />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Store>
    </Router>
  );
}

function About() {
  return (
    <div className="App">
      <HeaderBar fancy={false} />
      <div
        className="basicPage pixelImage"
        style={{
          marginTop: '50px',
          backgroundImage: 'url(/assets/textures/blackstone.png)',
          backgroundSize: 64,
        }}
      >
        <ShuffleCollection />
      </div>
      <DiscordWidget />
      <Footer />
    </div>
  );
}

export default App;
