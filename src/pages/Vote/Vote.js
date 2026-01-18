import React, { useContext } from 'react';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { Footer } from '../../components/Footer/Footer';
import { Context } from '../../Store';
import { DiscordWidget } from '../../components/DiscordWidget/DiscordWidget';
import './guide.scss';

export const Vote = (props) => {
  const [state] = useContext(Context);

  return (
    <div className="App Guide">
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
          <img
            style={{
              display: 'block',
              width: '100vw',
              height: '100%',
              objectFit: 'cover',
            }}
            src="/assets/images/guide-bkg.png"
            alt="info background"
          />
        </div>
        <div className="infoBanner shadow-darker">
          <p>Vote for Faceland!</p>
          <p>Rewards reset on the first of every month!</p>
          <p>Be sure to login to collect rewards!</p>
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
            <a href="https://minecraft-mp.com/server-s314207" target="_blank">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                border="0"
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
            <a href="https://minecraft-mp.com/server-s314207" target="_blank">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                border="0"
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
            <a href="https://minecraft-mp.com/server-s314207" target="_blank">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                border="0"
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
            <a href="https://minecraft-mp.com/server-s314207" target="_blank">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                border="0"
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
            <a href="https://minecraft-mp.com/server-s314207" target="_blank">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                border="0"
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
            <a href="https://minecraft-mp.com/server-s314207" target="_blank">
              <img
                src="https://minecraft-mp.com/banner-314207.png"
                border="0"
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
