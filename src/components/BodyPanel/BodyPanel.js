import React, { useRef, useEffect, useState } from 'react';
import './bodyPanel.scss';

export const BodyPanel = ({ slideFrom, children, ...props }) => {
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
    <div {...props} ref={panelRef} className={`basicPanel ${getAnimationClass()}`}>
      {children}
    </div>
  );
};
