import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './guideContent.scss';

const parseContent = (text) => {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i++;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      elements.push({ type: 'heading', text: trimmed.slice(2) });
      i++;
    } else if (trimmed.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push({ type: 'list', items });
    } else if (trimmed.startsWith('%')) {
      elements.push({ type: 'flavor', text: trimmed.slice(1).trim() });
      i++;
    } else if (trimmed.startsWith('img:')) {
      elements.push({ type: 'image', src: trimmed.slice(4).trim() });
      i++;
    } else {
      elements.push({ type: 'paragraph', text: trimmed });
      i++;
    }
  }

  return elements;
};

export const GuideContent = ({ slug }) => {
  const [elements, setElements] = useState(null);

  useEffect(() => {
    setElements(null);
    fetch(`/guides/${slug}.txt`)
      .then((res) => res.text())
      .then((text) => setElements(parseContent(text)))
      .catch(() => setElements([]));
  }, [slug]);

  if (elements === null) {
    return <div className="guideLoading">Loading...</div>;
  }

  return (
    <div className="guideContentWrapper">
      {elements.map((el, i) => {
        switch (el.type) {
          case 'heading':
            return <h2 key={i} className="guideHeading">{el.text}</h2>;
          case 'paragraph':
            return <p key={i} className="guideParagraph">{el.text}</p>;
          case 'flavor':
            return <p key={i} className="guideFlavor">{el.text}</p>;
          case 'list':
            return (
              <ul key={i} className="guideList">
                {el.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case 'image':
            return (
              <div key={i} className="guideImageContainer">
                <img className="guideImage" src={el.src} alt="" />
              </div>
            );
          default:
            return null;
        }
      })}
      <Link to="/guides" className="guideReturnButton">Return To Guides</Link>
    </div>
  );
};
