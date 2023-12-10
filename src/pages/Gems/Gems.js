import React from 'react';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { Footer } from '../../components/Footer/Footer';

import './gems.scss';

export const Gems = (props) => {
  return (
    <div className="App Gems">
      <HeaderBar fancy={true} />
      <div className="bodySection">
        <div className="bodyPadding">hi</div>
      </div>
      <Footer />
    </div>
  );
};
