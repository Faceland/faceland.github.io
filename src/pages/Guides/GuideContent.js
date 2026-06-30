import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO/SEO';
import { GUIDES, RELATED } from './guidesData';
import './guideContent.scss';

const SITE_ORIGIN = 'https://face.land';

const parseContent = (text) => {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  // Track the most recent heading so images can fall back to a section-aware
  // alt when the author hasn't supplied an explicit one.
  let lastHeading = null;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i++;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      lastHeading = trimmed.slice(2);
      elements.push({ type: 'heading', text: lastHeading });
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
      // Optional alt text after a pipe: "img:/path.png|Descriptive alt text".
      const raw = trimmed.slice(4).trim();
      const pipe = raw.indexOf('|');
      const src = pipe === -1 ? raw : raw.slice(0, pipe).trim();
      const alt = pipe === -1 ? '' : raw.slice(pipe + 1).trim();
      elements.push({ type: 'image', src, alt, context: lastHeading });
      i++;
    } else {
      elements.push({ type: 'paragraph', text: trimmed });
      i++;
    }
  }

  return elements;
};

export const GuideContent = ({ slug }) => {
  const meta = GUIDES.find((g) => g.path === slug);
  const [elements, setElements] = useState(null);

  useEffect(() => {
    setElements(null);
    fetch(`/guides/${slug}.txt`)
      .then((res) => res.text())
      .then((text) => setElements(parseContent(text)))
      .catch(() => setElements([]));
  }, [slug]);

  // BreadcrumbList structured data (Home > Guides > This Guide) so search
  // engines understand the guide hierarchy and can show breadcrumb rich results.
  // Injected per guide and cleaned up on unmount.
  useEffect(() => {
    if (!meta) return undefined;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_ORIGIN}/guides/` },
        {
          '@type': 'ListItem',
          position: 3,
          name: `${meta.name} Guide`,
          item: `${SITE_ORIGIN}/guides/${meta.path}/`,
        },
      ],
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'guide-breadcrumb-data';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      const existing = document.getElementById('guide-breadcrumb-data');
      if (existing) existing.remove();
    };
  }, [meta]);

  // Give every image a meaningful alt. Explicit alt (from "img:...|alt") wins;
  // otherwise derive one from the guide + section so nothing ships alt="".
  const altFor = (el) => {
    if (el.alt) return el.alt;
    if (!meta) return el.context || '';
    if (!el.context || el.context === meta.name) {
      return `Overview of ${meta.name} in Faceland, a Minecraft MMORPG`;
    }
    return `${meta.name} guide: ${el.context}`;
  };

  // Per-page SEO so each guide has a unique title/description (rendered in every
  // state so the canonical/title are correct the moment react-snap pre-renders).
  const seo = meta ? (
    <SEO title={`${meta.name} Guide`} description={meta.description} />
  ) : null;

  const breadcrumb = meta ? (
    <nav className="guideBreadcrumb" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      <span className="guideBreadcrumbSep">/</span>
      <Link to="/guides/">Guides</Link>
      <span className="guideBreadcrumbSep">/</span>
      <span className="guideBreadcrumbCurrent">{meta.name}</span>
    </nav>
  ) : null;

  const related =
    meta && RELATED[meta.path]
      ? RELATED[meta.path].map((p) => GUIDES.find((g) => g.path === p)).filter(Boolean)
      : [];

  if (elements === null) {
    return (
      <>
        {seo}
        <div className="guideContentWrapper">
          {breadcrumb}
          <div className="guideLoading">Loading...</div>
        </div>
      </>
    );
  }

  // The first heading becomes the page's single <h1>; the rest stay <h2>.
  const firstHeadingIndex = elements.findIndex((el) => el.type === 'heading');

  return (
    <>
      {seo}
      <div className="guideContentWrapper">
        {breadcrumb}
        {elements.map((el, i) => {
          switch (el.type) {
            case 'heading':
              return i === firstHeadingIndex ? (
                <h1 key={i} className="guideTitle">
                  {el.text}
                </h1>
              ) : (
                <h2 key={i} className="guideHeading">
                  {el.text}
                </h2>
              );
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
                  <img
                    className="guideImage"
                    src={el.src}
                    alt={altFor(el)}
                    loading="lazy"
                  />
                </div>
              );
            default:
              return null;
          }
        })}

        {related.length > 0 && (
          <div className="relatedGuides">
            <h2 className="relatedGuidesTitle">Related Guides</h2>
            <div className="relatedGuidesLinks">
              {related.map((g) => (
                <Link
                  key={g.path}
                  to={`/guides/${g.path}/`}
                  className="relatedGuideLink"
                  style={{ '--panel-accent': g.accent, '--panel-border': g.border }}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link to="/guides/" className="guideReturnButton">Return To Guides</Link>
      </div>
    </>
  );
};
