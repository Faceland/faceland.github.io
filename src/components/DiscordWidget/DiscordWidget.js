import React, { useState } from 'react';
import './discordWidget.scss';

export const DiscordWidget = () => {
  const [widgetOpen, setWidgetState] = useState(false);

  const toggleWidget = () => {
    setWidgetState(!widgetOpen);
  };

  const button = (
    <div
      className="shadow-normal flex flex-col place-content-center"
      style={{
        height: 80,
        width: 80,
        backgroundColor: '#5865F2',
        borderRadius: 5,
      }}
      onClick={toggleWidget}
    >
      <svg
        className="h-12"
        xmlns="http://www.w3.org/2000/svg"
        fill={'#ffffff'}
        viewBox="0 0 16 16"
      >
        <path d="M6.552 6.712c-.456 0-.816.4-.816.888s.368.888.816.888c.456 0 .816-.4.816-.888.008-.488-.36-.888-.816-.888zm2.92 0c-.456 0-.816.4-.816.888s.368.888.816.888c.456 0 .816-.4.816-.888s-.36-.888-.816-.888z" />
        <path d="M13.36 0H2.64C1.736 0 1 .736 1 1.648v10.816c0 .912.736 1.648 1.64 1.648h9.072l-.424-1.48 1.024.952.968.896L15 16V1.648C15 .736 14.264 0 13.36 0zm-3.088 10.448s-.288-.344-.528-.648c1.048-.296 1.448-.952 1.448-.952-.328.216-.64.368-.92.472-.4.168-.784.28-1.16.344a5.604 5.604 0 0 1-2.072-.008 6.716 6.716 0 0 1-1.176-.344 4.688 4.688 0 0 1-.584-.272c-.024-.016-.048-.024-.072-.04-.016-.008-.024-.016-.032-.024-.144-.08-.224-.136-.224-.136s.384.64 1.4.944c-.24.304-.536.664-.536.664-1.768-.056-2.44-1.216-2.44-1.216 0-2.576 1.152-4.664 1.152-4.664 1.152-.864 2.248-.84 2.248-.84l.08.096c-1.44.416-2.104 1.048-2.104 1.048s.176-.096.472-.232c.856-.376 1.536-.48 1.816-.504.048-.008.088-.016.136-.016a6.521 6.521 0 0 1 4.024.752s-.632-.6-1.992-1.016l.112-.128s1.096-.024 2.248.84c0 0 1.152 2.088 1.152 4.664 0 0-.68 1.16-2.448 1.216z" />
      </svg>
    </div>
  );

  const widget = (
    <div>
      <button
        style={{ position: 'relative', float: 'right', top: -7 }}
        onClick={toggleWidget}
      >
        x
      </button>
      <iframe
        title="discord"
        src="https://discord.com/widget?id=133012942890336256&theme=dark"
        width="350"
        height="500"
        frameBorder="0"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
      ></iframe>
    </div>
  );

  return <div className="discordContainer">{widgetOpen ? widget : button}</div>;
};
