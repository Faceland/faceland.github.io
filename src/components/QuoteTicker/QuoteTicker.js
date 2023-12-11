import React, { StrictMode } from 'react';
import Ticker from 'react-ticker';

import './quoteTicker.scss';

export const QuoteTicker = () => {
  const quotes = [
    { text: 'An incredible GAMING experience..', author: 'Gamers LTD' },
    { text: "It's the 'Mario Pissing' of MMORPGs!", author: 'Faceguy' },
    {
      text: 'This game made me shit myself - In a good way!',
      author: 'You, probably',
    },
    {
      text: 'Wow! Another Minecraft RPG!',
      author: 'minecraft-servers-list.gov',
    },
    {
      text: 'I need OP to review your server, or it will be removed...',
      author: 'PMC Server Reviewer',
    },
    { text: 'Uninspired!', author: 'Some Dominion Clown' },
    { text: 'I am men.', author: 'Waffler527' },
    { text: 'The owner is a madman', author: 'Looni' },
    { text: 'Ability contest results WHEN?!', author: 'Faceland Community' },
  ];

  // TODO: react-ticker doesn't work with React 18: https://github.com/AndreasFaust/react-ticker/issues/61
  // replace with react-fast-marquee: https://github.com/justin-chu/react-fast-marquee
  return (
    // <StrictMode>
    <div className="quoteTicker">
      <Ticker>
        {({ index }) => (
          <div key={index} className="quoteText">
            <h3 className="quoteBody">❝ {quotes[index]?.text}❞</h3>
            <p className="quoteSubtext">-{quotes[index]?.author}</p>
          </div>
        )}
      </Ticker>
    </div>
    // </StrictMode>
  );
};
