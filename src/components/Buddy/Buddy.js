import React, { useEffect, useState, useRef } from 'react';
import useSound from 'use-sound';

import './buddy.scss';
import boopSfx from '../../sounds/Player_hurt1.mp3';

export const Buddy = () => {
  const [life, setLife] = useState(Math.random() < 1 ? 5 : 0);
  const [shake, setShake] = useState(false);
  // Disable this stupid warning: 'The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.'
  // https://github.com/joshwcomeau/use-sound/issues/22
  const [play] = useSound(boopSfx);
  const [x, setX] = useState();
  const [y, setY] = useState();
  const [hitMarkers, setHitMarkers] = useState([]);
  let shakeTimeout;
  let hitTimer;

  useEffect(() => {
    tickMarkers();
    return () => {
      hitTimer && clearTimeout(hitTimer);
      setHitMarkers([]);
    };
  }, [setHitMarkers]);

  useEffect(() => {
    const update = (e) => {
      setX(e.x);
      setY(e.y);
    };
    window.addEventListener('mousemove', update);
    window.addEventListener('touchmove', update);
    return () => {
      window.removeEventListener('mousemove', update);
      window.removeEventListener('touchmove', update);
    };
  }, [setX, setY]);

  const markerRef = useRef(hitMarkers);
  markerRef.current = hitMarkers;

  const tickMarkers = () => {
    if (markerRef.current.length === 0 && life === 0) {
      return;
    }
    hitTimer = setTimeout(() => {
      if (markerRef.current.length > 0) {
        let newValues = [];
        markerRef.current.forEach((newMarker) => {
          if (newMarker.lifespan > 0) {
            newMarker.x = newMarker.x + newMarker.xVelocity;
            newMarker.y = newMarker.y + newMarker.yVelocity;
            newMarker.yVelocity = newMarker.yVelocity + 20;
            newMarker.lifespan--;
            newValues.push(newMarker);
          }
        });
        setHitMarkers(newValues);
      }
      tickMarkers();
    }, 100);
  };

  const playSound = () => {
    play();
  };

  const doShake = () => {
    setShake(true);
    shakeTimeout && clearTimeout(shakeTimeout);
    shakeTimeout = setTimeout(() => {
      setShake(false);
    }, 100);
  };

  const createHitMarker = (id) => {
    const hitMarker = { id: id };
    hitMarker.lifespan = 10;
    hitMarker.x = x;
    hitMarker.y = y;
    hitMarker.xVelocity = 80 * (-0.5 + Math.random());
    hitMarker.yVelocity = -30 - 50 * Math.random();
    hitMarker.text = 8 + Math.floor(Math.random() * Math.floor(22));

    const newMarkers = hitMarkers;
    newMarkers.push(hitMarker);
    setHitMarkers(newMarkers);
  };

  if (life < 1) {
    return (
      <div>
        {hitMarkers.map((marker, index) => (
          <div
            id={`marker-${marker.id}`}
            key={`marker-${marker.id}`}
            className="hit-marker no-select"
            style={{
              top: marker.y,
              left: marker.x,
            }}
          >
            {marker.text}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {hitMarkers.map((marker, index) => (
        <div
          id={`marker-${marker.id}`}
          key={`marker-${marker.id}`}
          className="hit-marker no-select"
          style={{
            top: marker.y,
            left: marker.x,
          }}
        >
          {marker.text}
        </div>
      ))}
      <img
        className={`buddy no-select ${shake ? 'hitShake' : ''}`}
        src="/assets/images/GY83tsk.png"
        alt="facebuddy"
        onClick={() => {
          doShake();
          createHitMarker(life);
          playSound();
          setLife(life - 1);
        }}
      />
    </div>
  );
};
