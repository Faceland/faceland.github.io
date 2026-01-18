import React, { useContext } from 'react';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { Context } from '../../Store';
import './embed.scss';
import { Footer } from '../../components/Footer/Footer';

export const Embed = () => {
  const [state] = useContext(Context);

  const desktopLayout = (
    <div className="basicPage">
      <div className="embedBox">
        <div className="embedZone">
          <div className="embedFrame">
            <iframe
              src="http://199.127.61.235:8100/#quest_world:8:0:888:1500:0:0:0:0:perspective"
              title="Embedded Content"
              frameBorder="0"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

  const mobileLayout = (
    <div className="basicPage">
      <div className="mobileEmbedContainer">
        <div className="embedContainer">
          <div className="mobileEmbedZone">
            <div className="embedFrame">
              <iframe
                src="http://199.127.61.235:8100/#quest_world:8:0:888:1500:0:0:0:0:perspective"
                title="Embedded Content"
                frameBorder="0"
                allowFullScreen
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="App Embed">
      <HeaderBar fancy={false} />
      {state.mobile ? mobileLayout : desktopLayout}
    </div>
  );
};
