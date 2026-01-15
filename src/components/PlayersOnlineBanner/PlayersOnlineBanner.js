import React, { useState, useEffect } from 'react';
import './PlayersOnlineBanner.scss';

export const PlayersOnlineBanner = (props) => {
  const [playerCount, setPlayerCount] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  let timer;

  useEffect(() => {
    fetchStatus();
    return () => {
      timer && clearTimeout(timer);
    };
  }, []);

  const fetchStatus = () => {
    fetch('https://api.mcsrvstat.us/2/PLAY.FACE.LAND')
      .then((res) => res.json())
      .then(
        (result) => {
          if (!result || !result.online || result.players === undefined) {
            setIsOffline(true);
            setPlayerCount(null);
          } else {
            setIsOffline(false);
            setPlayerCount(result.players.online);
          }
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          console.log('Failed to get player online', error);
        },
      );
    timer = setTimeout(() => {
      fetchStatus();
    }, 60000);
  };

  const renderMessage = () => {
    if (playerCount === null && !isOffline) {
      return 'Loading...';
    }
    if (isOffline) {
      return 'Dang son! Faceland appears to be offline!';
    }
    return (
      <>
        There are <span className={playerCount > 0 ? 'pulse' : ''}>{playerCount}</span> gamers GAMING!
      </>
    );
  };

  return (
    <div className="playersOnlineBanner shadow-normal">
      <p>{renderMessage()}</p>
    </div>
  );
};
