import React, { useContext, useEffect } from 'react';
import { Context } from '../Store';

export const MobileStateHandler = () => {
  const [state, dispatch] = useContext(Context);

  window.onresize = function () {
    dispatch({
      type: 'SET_MOBILE_MODE',
      payload: window.innerHeight / window.innerWidth > 1,
    });
  };

  useEffect(() => {
    dispatch({
      type: 'SET_MOBILE_MODE',
      payload: window.innerHeight / window.innerWidth > 1,
    });
  }, []);

  return <div />;
};
