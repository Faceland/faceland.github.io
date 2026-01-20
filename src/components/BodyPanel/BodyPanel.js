import React, { useRef, useEffect, useState, useMemo } from 'react';
import './bodyPanel.scss';

const textureImages = {
  dirt: '/assets/textures/dirt.png',
  cobblestone: '/assets/textures/cobblestone.png',
  blackstone: '/assets/textures/blackstone.png',
};

// Seeded random for consistent tile pattern
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate random tile positions for upward extension
const generateTilePattern = (seed, numColumns = 60) => {
  // First pass: determine which columns have tiles
  const columns = [];
  let skipNext = 0;

  for (let i = 0; i < numColumns; i++) {
    if (skipNext > 0) {
      skipNext--;
      columns.push(false);
      continue;
    }

    const rand = seededRandom(seed + i * 7);
    const rand3 = seededRandom(seed + i * 17 + 100);

    if (rand > 0.6) {
      columns.push(true);
      skipNext = Math.floor(rand3 * 3);
    } else {
      columns.push(false);
    }
  }

  // Second pass: assign heights (tall only if has neighbor)
  const tiles = [];
  for (let i = 0; i < numColumns; i++) {
    if (!columns[i]) continue;

    const hasLeftNeighbor = i > 0 && columns[i - 1];
    const hasRightNeighbor = i < numColumns - 1 && columns[i + 1];
    const hasNeighbor = hasLeftNeighbor || hasRightNeighbor;

    const rand2 = seededRandom(seed + i * 13 + 50);
    const height = (hasNeighbor && rand2 > 0.5) ? 128 : 64;

    tiles.push({ x: i * 64, height, hasNeighbor });
  }

  // Ensure minimums: at least 2 tall with neighbors, at least 1 isolated
  const tallWithNeighbor = tiles.filter(t => t.height === 128 && t.hasNeighbor);
  const isolated = tiles.filter(t => !t.hasNeighbor);

  // Force tall neighbors if needed
  if (tallWithNeighbor.length < 2) {
    const neighboredTiles = tiles.filter(t => t.hasNeighbor && t.height === 64);
    for (let i = 0; i < Math.min(2 - tallWithNeighbor.length, neighboredTiles.length); i++) {
      neighboredTiles[i].height = 128;
    }
  }

  // Force at least one isolated if none exist
  if (isolated.length === 0 && tiles.length > 0) {
    // Find a good spot to add an isolated tile
    const rand = seededRandom(seed + 999);
    const isolatedPos = Math.floor(rand * numColumns * 0.8) + 5;
    tiles.push({ x: isolatedPos * 64, height: 64, hasNeighbor: false });
  }

  return tiles.map(({ x, height }) => ({ x, height }));
};

// Background component that handles all textures and blending
export const TexturedBackground = ({ children }) => {
  const containerRef = useRef(null);
  const [sectionHeights, setSectionHeights] = useState([0, 0, 0]);

  const tilePattern1 = useMemo(() => generateTilePattern(42), []);
  const tilePattern2 = useMemo(() => generateTilePattern(137), []);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeights = () => {
      const panels = containerRef.current.querySelectorAll('.bodyPanel');
      const heights = Array.from(panels).map(p => p.offsetHeight);
      setSectionHeights(heights);
    };

    updateHeights();
    window.addEventListener('resize', updateHeights);

    // Use ResizeObserver for more accurate updates
    const observer = new ResizeObserver(updateHeights);
    observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', updateHeights);
      observer.disconnect();
    };
  }, [children]);

  const section1Height = sectionHeights[0] || 400;
  const section2Height = sectionHeights[1] || 400;
  const section3Height = sectionHeights[2] || 400;
  const section2Top = section1Height;
  const section3Top = section1Height + section2Height;

  return (
    <div className="textured-background" ref={containerRef}>
      {/* Layer 1: Dirt (base) */}
      <div
        className="texture-layer texture-dirt"
        style={{
          backgroundImage: `url(${textureImages.dirt})`,
          height: section1Height + 192, // Extend down for overlap
        }}
      />

      {/* Layer 2: Cobblestone with upward tiles */}
      <div
        className="texture-layer texture-cobblestone"
        style={{
          backgroundImage: `url(${textureImages.cobblestone})`,
          top: section2Top,
          height: section2Height + 192,
        }}
      />
      {/* Cobblestone tiles extending up into dirt */}
      <div className="tile-blend-container" style={{ top: section2Top - 192 }}>
        {tilePattern1.map((tile, index) => (
          <div
            key={`cobble-${index}`}
            className="blend-tile"
            style={{
              left: tile.x % (64 * 50),
              bottom: 0,
              height: tile.height,
              backgroundImage: `url(${textureImages.cobblestone})`,
              backgroundPosition: `${-tile.x}px bottom`,
            }}
          />
        ))}
      </div>

      {/* Layer 3: Blackstone with upward tiles */}
      <div
        className="texture-layer texture-blackstone"
        style={{
          backgroundImage: `url(${textureImages.blackstone})`,
          top: section3Top,
          height: section3Height,
        }}
      />
      {/* Blackstone tiles extending up into cobblestone */}
      <div className="tile-blend-container" style={{ top: section3Top - 192 }}>
        {tilePattern2.map((tile, index) => (
          <div
            key={`black-${index}`}
            className="blend-tile"
            style={{
              left: tile.x % (64 * 50),
              bottom: 0,
              height: tile.height,
              backgroundImage: `url(${textureImages.blackstone})`,
              backgroundPosition: `${-tile.x}px bottom`,
            }}
          />
        ))}
      </div>

      {/* Content layer */}
      <div className="content-layer">
        {children}
      </div>
    </div>
  );
};

// Simple panel for content - no background, just animation
export const BodyPanel = ({ slideFrom, className = '', children, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    if (panelRef.current) {
      observer.observe(panelRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const getAnimationClass = () => {
    if (!slideFrom) return '';
    if (!isVisible) return `slide-from-${slideFrom}-hidden`;
    return `slide-from-${slideFrom}-visible`;
  };

  return (
    <div {...props} ref={panelRef} className={`bodyPanel ${getAnimationClass()} ${className}`}>
      {children}
    </div>
  );
};
