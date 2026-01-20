import React, { useContext } from 'react';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { MainBanner } from '../../components/MainBanner/MainBanner';
import { PlayersOnlineBanner } from '../../components/PlayersOnlineBanner/PlayersOnlineBanner';
import { Footer } from '../../components/Footer/Footer';
import { BodyPanel, TexturedBackground } from '../../components/BodyPanel/BodyPanel';
import { Context } from '../../Store';
import { DiscordWidget } from '../../components/DiscordWidget/DiscordWidget';
import { QuoteTicker } from '../../components/QuoteTicker/QuoteTicker';

import './home.scss';

export const Home = (props) => {
  const [state] = useContext(Context);

  // Use images with a height of 300px or greater with
  // the 'action' in the center for best results
  const homeImageOne = (
    <video
      className="fillImg"
      playsInline
      autoPlay
      muted
      loop
      src="/assets/videos/mYH3xSq.mp4"
      crossOrigin="anonymous"
    />
  );

  const bodyOne = (
    <div>
      <div className="panelTitle">Over 200 Amazing Abilities</div>
      <div className="panelText">
        Faceland has over 200 abilities to unlock! Each ability is unique and
        can range from crazy attacks to buffs for your whole party! Mix and
        match abilities to make a truly unique setup, then crush some monsters
        (or players!)
      </div>
      <div className="panelText">
        Unlock new abilities by leveling up your combat skills! There's tons of
        options like Swordsmanship, Archery, Arcane Magics, and more!
      </div>
    </div>
  );

  const homeImageTwo = (
    <video
      className="fillImg"
      playsInline
      autoPlay
      muted
      loop
      src="/assets/videos/qUbW0PT.mp4"
      crossOrigin="anonymous"
    />
  );

  const bodyTwo = (
    <div>
      <div className="panelTitle">Skills Aren't Just For Combat!</div>
      <div className="panelText">
        Level up up more than a dozen non-combat skills and become the ultimates
        tradesman! Make your money with Fishing, Enchanting, Crafting, Mining
        and more!
      </div>
      <div className="panelText">
        Explore awesome mini-games or improve your character's stats with skills
        like Agility and Sneak!
      </div>
    </div>
  );

  const homeImageThree = (
    <video
      className="fillImg"
      playsInline
      autoPlay
      muted
      loop
      src="/assets/videos/vYSxlly.mp4"
      crossOrigin="anonymous"
    />
  );

  const bodyThree = (
    <div>
      <div className="panelTitle">Loot Loot Loot!</div>
      <div className="panelText">
        Faceland features an amazing random item generation system, as well as
        some rare pre-made items from bosses and monsters! There's infinite
        possibilities, with more than a trillion possible combinations for any
        one item type!
      </div>
      <div className="panelText">
        Upgrade your gear! Not only are there limitless options in what gear you
        can find, you can upgrade and customize items with gems, scrolls, and
        tomes to make the perfect loadout!
      </div>
    </div>
  );

  const mobileSection = (image, body) => (
    <div className="flexCol">
      <div className="flexRow width100 centerContent">{image}</div>
      <div className="flexRow width100">{body}</div>
    </div>
  );

  const desktopSection = (image, body, inverted) => (
    <div className="flexRow">
      <div className={`flexCol width${inverted ? '60' : '40 centerContent'}`}>
        {inverted ? body : image}
      </div>
      <div className={`flexCol width${inverted ? '40 centerContent' : '60'}`}>
        {inverted ? image : body}
      </div>
    </div>
  );

  return (
    <div className="App Home">
      <HeaderBar fancy={true} />
      <MainBanner />
      <PlayersOnlineBanner />
      <div className="bodySection pixelImage">
        <TexturedBackground>
          <BodyPanel slideFrom="right">
            {state.mobile
              ? mobileSection(homeImageOne, bodyOne)
              : desktopSection(homeImageOne, bodyOne, false)}
          </BodyPanel>
          <BodyPanel slideFrom="left">
            {state.mobile
              ? mobileSection(homeImageTwo, bodyTwo)
              : desktopSection(homeImageTwo, bodyTwo, true)}
          </BodyPanel>
          <BodyPanel slideFrom="right">
            {state.mobile
              ? mobileSection(homeImageThree, bodyThree)
              : desktopSection(homeImageThree, bodyThree, false)}
          </BodyPanel>
        </TexturedBackground>
      </div>
      <QuoteTicker />
      <DiscordWidget />
      <Footer />
    </div>
  );
};
