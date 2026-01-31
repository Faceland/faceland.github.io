import './App.scss';
import './animations.scss';

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Store from './Store';

import { HeaderBar } from './components/HeaderBar/HeaderBar';
import { Footer } from './components/Footer/Footer';
import { MobileStateHandler } from './components/MobileStateHandler';
import { ShuffleCollection } from './components/Shuffle/ShuffleCollection';
import { Home } from './pages/Home/Home';
import { DiscordWidget } from './components/DiscordWidget/DiscordWidget';
import { Guide } from './pages/Guide/Guide';
import { Portrait } from './pages/Portrait/Portrait';
import { Vote } from './pages/Vote/Vote';
import { SEO } from './components/SEO/SEO';

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
          <Route path="facepals" element={<Portrait />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Store>
    </Router>
  );
}

function About() {
  return (
    <div className="App">
      <SEO
        title="Item Database"
        description="Browse Faceland's extensive item database! Discover unique weapons, armor, and gear with our item shuffle tool. Over a trillion possible item combinations in our Minecraft MMORPG!"
      />
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
