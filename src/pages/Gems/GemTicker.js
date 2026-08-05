import React from 'react';
import Marquee from 'react-fast-marquee';
import { dollars, purchaseLabel } from './gemsData';

// Scrolling band along the bottom of /gems — same idea as the home page's
// QuoteTicker, in the FaceGems purple. Shows the shop's "#1 SIMP" (gold border,
// lifetime total) and "The Boyz" recent purchases (silver border, package
// price). Only ~5 entries exist, so they're spaced far wider than the quotes.
export const GemTicker = ({ topDonor, recentPurchases = [], packages }) => {
  const entries = [
    ...(topDonor
      ? [
          {
            key: 'donor',
            tone: 'gold',
            tag: '#1 SIMP',
            avatar: topDonor.avatar,
            name: topDonor.name,
            amount: dollars(topDonor.totalUSD),
          },
        ]
      : []),
    ...recentPurchases.map((entry, i) => ({
      key: `recent-${i}-${entry.name}`,
      tone: 'silver',
      tag: 'RECENT PURCHASE',
      avatar: entry.avatar,
      name: entry.name,
      amount: purchaseLabel(entry, packages),
    })),
  ];

  if (!entries.length) return null;

  return (
    <div className="gemTicker">
      <Marquee>
        {entries.map((entry) => (
          <div key={entry.key} className="gemTickerEntry">
            <img
              className={`gemTickerAvatar is-${entry.tone}`}
              src={entry.avatar}
              alt=""
              aria-hidden="true"
              loading="lazy"
            />
            <div className="gemTickerText">
              {entry.tag && (
                <span className={`gemTickerTag is-${entry.tone}`}>{entry.tag}</span>
              )}
              <span className="gemTickerName">{entry.name}</span>
              <span className="gemTickerAmount">{entry.amount}</span>
            </div>
          </div>
        ))}
      </Marquee>
    </div>
  );
};
