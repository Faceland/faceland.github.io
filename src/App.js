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
import { GuidesLayout } from './pages/Guides/GuidesLayout';
import { GuidesIndex } from './pages/Guides/GuidesIndex';
import { StatsGuide } from './pages/Guides/StatsGuide';
import { AbilitiesGuide } from './pages/Guides/AbilitiesGuide';
import { EquipmentGuide } from './pages/Guides/EquipmentGuide';
import { UpgradesGuide } from './pages/Guides/UpgradesGuide';
import { MiningGuide } from './pages/Guides/MiningGuide';
import { GatheringGuide } from './pages/Guides/GatheringGuide';
import { FishingGuide } from './pages/Guides/FishingGuide';
import { CraftingGuide } from './pages/Guides/CraftingGuide';
import { EnchantingGuide } from './pages/Guides/EnchantingGuide';
import { AlchemyGuide } from './pages/Guides/AlchemyGuide';
import { CookingGuide } from './pages/Guides/CookingGuide';
import { AgilityGuide } from './pages/Guides/AgilityGuide';
import { LoremasterGuide } from './pages/Guides/LoremasterGuide';
import { TradingGuide } from './pages/Guides/TradingGuide';
import { PrayerGuide } from './pages/Guides/PrayerGuide';
import { SneakGuide } from './pages/Guides/SneakGuide';
import { QuestingGuide } from './pages/Guides/QuestingGuide';
import { HousesGuide } from './pages/Guides/HousesGuide';
import { MountsGuide } from './pages/Guides/MountsGuide';
import { PetsGuide } from './pages/Guides/PetsGuide';
import { GuildsGuide } from './pages/Guides/GuildsGuide';
import { OutpostsGuide } from './pages/Guides/OutpostsGuide';
import { DungeonsGuide } from './pages/Guides/DungeonsGuide';
import { ArenasGuide } from './pages/Guides/ArenasGuide';

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
          <Route path="guides" element={<GuidesLayout />}>
            <Route index element={<GuidesIndex />} />
            <Route path="stats" element={<StatsGuide />} />
            <Route path="abilities" element={<AbilitiesGuide />} />
            <Route path="equipment" element={<EquipmentGuide />} />
            <Route path="upgrades" element={<UpgradesGuide />} />
            <Route path="mining" element={<MiningGuide />} />
            <Route path="gathering" element={<GatheringGuide />} />
            <Route path="fishing" element={<FishingGuide />} />
            <Route path="crafting" element={<CraftingGuide />} />
            <Route path="enchanting" element={<EnchantingGuide />} />
            <Route path="alchemy" element={<AlchemyGuide />} />
            <Route path="cooking" element={<CookingGuide />} />
            <Route path="agility" element={<AgilityGuide />} />
            <Route path="loremaster" element={<LoremasterGuide />} />
            <Route path="trading" element={<TradingGuide />} />
            <Route path="prayer" element={<PrayerGuide />} />
            <Route path="sneak" element={<SneakGuide />} />
            <Route path="questing" element={<QuestingGuide />} />
            <Route path="houses" element={<HousesGuide />} />
            <Route path="mounts" element={<MountsGuide />} />
            <Route path="pets" element={<PetsGuide />} />
            <Route path="guilds" element={<GuildsGuide />} />
            <Route path="outposts" element={<OutpostsGuide />} />
            <Route path="dungeons" element={<DungeonsGuide />} />
            <Route path="arenas" element={<ArenasGuide />} />
          </Route>
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
