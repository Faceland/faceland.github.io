import React from 'react';
import Marquee from 'react-fast-marquee';
import './quoteTicker.scss';

export const QuoteTicker = () => {
  const quotes = [
    { text: 'An incredible GAMING experience..', author: 'Gamers LTD' },
    { text: "This is VANILLA?", author: 'flstrawberri' },
    { text: "It's the 'Mario Pissing' of MMORPGs!", author: 'Faceguy' },
    { text: "I'm pretty sure I played, W", author: 'ACraftingFish' },
    {
      text: 'This game made me shit myself - In a good way!',
      author: 'You, probably',
    },
    { text: 'It`s Playable!', author: 'Burgur' },
    {
      text: 'Wow! Another Minecraft RPG!',
      author: 'minecraft-servers-list.gov',
    },
    {
      text: 'I need OP to review your server, or it will be removed...',
      author: 'PMC Server Reviewer',
    },
    {
      text: 'Everything is so goddamn random it makes blackjack look like a skill-based game',
      author: 'JuggernautStyle',
    },
    { text: 'Uninspired!', author: 'Somebody from Dominion' },
    { text: 'I tried it and it was worth it', author: 'ToukoBlock' },
    { text: 'The owner is a madman', author: 'Looni' },
    { text: 'i think there is way too much going on', author: 'n3ttspend' },
    { text: 'Ability contest results WHEN?!', author: 'Faceland Community' },
  ];

  const getQuoteElements = () => {
    let index = 0;
    return quotes.map((quote) => {
      return (
        <div key={(index += 1)} className="quoteText">
          <h3 className="quoteBody">❝ {quote?.text}❞</h3>
          <p className="quoteSubtext">-{quote?.author}</p>
        </div>
      );
    });
  };

  return (
    <div className="quoteTicker">
      <Marquee>{getQuoteElements()}</Marquee>
    </div>
  );
};
