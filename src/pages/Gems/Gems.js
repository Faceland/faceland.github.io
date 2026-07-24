import React, { useCallback, useContext, useState } from 'react';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { Footer } from '../../components/Footer/Footer';
import { DiscordWidget } from '../../components/DiscordWidget/DiscordWidget';
import { SEO } from '../../components/SEO/SEO';
import { Context } from '../../Store';
import { gemPackages } from './gemsData';
import { GemPackageCard } from './GemPackageCard';
import { GemInfoModal } from './GemInfoModal';
import { GemCheckoutModal } from './GemCheckoutModal';
import { GemConstructionModal } from './GemConstructionModal'; // TEMP: remove when shop is live
import './gems.scss';

// In-site FaceGems storefront. Wraps the CraftingStore shop (shop.face.land) in
// an on-brand purple UI: browse packages here, and Buy Now drives the shop's
// cart + checkout behind the scenes inside a modal (see GemCheckoutModal).
export const Gems = () => {
  const [state] = useContext(Context);
  const [infoPkg, setInfoPkg] = useState(null);
  const [checkoutPkg, setCheckoutPkg] = useState(null);

  const openInfo = useCallback((pkg) => setInfoPkg(pkg), []);
  const closeInfo = useCallback(() => setInfoPkg(null), []);
  const openCheckout = useCallback((pkg) => {
    setInfoPkg(null);
    setCheckoutPkg(pkg);
  }, []);
  const closeCheckout = useCallback(() => setCheckoutPkg(null), []);

  return (
    <div className={`App Gems ${state.mobile ? 'gems-mobile' : ''}`}>
      <SEO
        title="Buy FaceGems"
        description="Purchase FaceGems for Faceland RPG — spend them on in-game cosmetics and global boosts, and unlock the Contributor rank on your first purchase. Pick a package and check out securely."
      />
      <HeaderBar fancy={false} />

      <div
        className="basicPage gemsPage pixelImage"
        style={{
          backgroundImage: 'url(/assets/textures/blackstone.png)',
          backgroundSize: 64,
        }}
      >
        <div className="gemsBanner shadow-darker">
          <img
            className="gemsBannerIcon"
            src="/assets/images/XAhGG80.png"
            alt=""
            aria-hidden="true"
          />
          <div className="gemsBannerText">
            <h1>Buy FaceGems</h1>
            <p>
              Fuel your adventure — spend FaceGems on in-game cosmetics and global boosts.
              Your first purchase unlocks the Contributor rank!
            </p>
          </div>
        </div>

        <div className="gemGrid">
          {gemPackages.map((pkg) => (
            <GemPackageCard key={pkg.id} pkg={pkg} onInfo={openInfo} onBuy={openCheckout} />
          ))}
        </div>

        <p className="gemsFinePrint">
          Payments are processed securely by CraftingStore. Faceland is not an official Minecraft
          product and is not associated with Mojang or Microsoft.
        </p>
      </div>

      {/* TEMP: under-construction notice while testing in production. */}
      <GemConstructionModal />

      <GemInfoModal pkg={infoPkg} onClose={closeInfo} onBuy={openCheckout} />
      <GemCheckoutModal pkg={checkoutPkg} onClose={closeCheckout} />

      <DiscordWidget />
      <Footer />
    </div>
  );
};
