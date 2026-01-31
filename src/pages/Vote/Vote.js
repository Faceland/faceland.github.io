import React, { useContext } from 'react';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { Footer } from '../../components/Footer/Footer';
import { Context } from '../../Store';
import { DiscordWidget } from '../../components/DiscordWidget/DiscordWidget';
import { SEO } from '../../components/SEO/SEO';
import { Picture } from '../../components/Picture/Picture';
import './guide.scss';

export const Vote = (props) => {
  const [state] = useContext(Context);

  return (
    <div className="App Guide">
      <SEO
        title="Vote"
        description="Vote for Faceland on Minecraft server lists and earn rewards! Support our free-to-play Minecraft MMORPG and help new players discover us. Monthly rewards reset!"
      />
      <HeaderBar fancy={false} />
      <div className="basicPage">
        <div
          style={{
            maxWidth: '100%',
            display: 'flex',
            height: 400,
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Picture
            style={{
              display: 'block',
              width: '100vw',
              height: '100%',
              objectFit: 'cover',
            }}
            src="/assets/images/guide-bkg.png"
            alt="Vote page background"
          />
        </div>
        <div className="infoBanner shadow-darker">
          <h1>Vote for Faceland!</h1>
          <p>Vote for Faceland on votesites and collect various vote rewards in-game! Rewards get better and better the more you vote in the same month!</p>
          <p>Rewards reset on the first of every month. Be sure to login to collect rewards!</p>
        </div>
        <div
          className="pixelImage"
          style={{
            maxWidth: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: 30,
            flexWrap: 'wrap',
            backgroundImage: 'url(/assets/images/NTfIQxD.png)',
            backgroundSize: 128,
          }}
        >
          <div
            className="shadow-darker"
            style={{
              backgroundColor: 'gray',
              margin: 10,
              padding: 20,
              borderRadius: 6,
            }}
          >
            <a href="https://minecraft-mp.com/server-s314207" target="_blank" rel="noopener noreferrer">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                alt="Vote for Faceland on Minecraft-MP"
                loading="lazy"
              />
            </a>
          </div>
          <div
            className="shadow-darker"
            style={{
              backgroundColor: 'gray',
              margin: 10,
              padding: 20,
              borderRadius: 6,
            }}
          >
            <a href="https://minecraft-mp.com/server-s314207" target="_blank" rel="noopener noreferrer">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                alt="Vote for Faceland on Minecraft-MP"
                loading="lazy"
              />
            </a>
          </div>
          <div
            className="shadow-darker"
            style={{
              backgroundColor: 'gray',
              margin: 10,
              padding: 20,
              borderRadius: 6,
            }}
          >
            <a href="https://minecraft-mp.com/server-s314207" target="_blank" rel="noopener noreferrer">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                alt="Vote for Faceland on Minecraft-MP"
                loading="lazy"
              />
            </a>
          </div>
          <div
            className="shadow-darker"
            style={{
              backgroundColor: 'gray',
              margin: 10,
              padding: 20,
              borderRadius: 6,
            }}
          >
            <a href="https://minecraft-mp.com/server-s314207" target="_blank" rel="noopener noreferrer">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                alt="Vote for Faceland on Minecraft-MP"
                loading="lazy"
              />
            </a>
          </div>
          <div
            className="shadow-darker"
            style={{
              backgroundColor: 'gray',
              margin: 10,
              padding: 20,
              borderRadius: 6,
            }}
          >
            <a href="https://minecraft-mp.com/server-s314207" target="_blank" rel="noopener noreferrer">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                alt="Vote for Faceland on Minecraft-MP"
                loading="lazy"
              />
            </a>
          </div>
          <div
            className="shadow-darker"
            style={{
              backgroundColor: 'gray',
              margin: 10,
              padding: 20,
              borderRadius: 6,
            }}
          >
            <a href="https://minecraft-mp.com/server-s314207" target="_blank" rel="noopener noreferrer">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                alt="Vote for Faceland on Minecraft-MP"
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </div>
      <DiscordWidget />
      <Footer />
    </div>
  );
};
