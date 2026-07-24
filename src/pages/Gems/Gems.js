import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { Footer } from '../../components/Footer/Footer';
import { DiscordWidget } from '../../components/DiscordWidget/DiscordWidget';
import { SEO } from '../../components/SEO/SEO';
import { Context } from '../../Store';
import { staticShopData } from './gemsData';
import { fetchLiveShopData } from './shopFetch';
import { GemPackageCard } from './GemPackageCard';
import { GemInfoModal } from './GemInfoModal';
import { GemCheckoutModal } from './GemCheckoutModal';
import { GemTicker } from './GemTicker';
import { GemResultModal, paymentStatusFrom } from './GemResultModal';
import { GemConstructionModal } from './GemConstructionModal'; // TEMP: remove when shop is live
import './gems.scss';

// In-site FaceGems storefront. Wraps the CraftingStore shop (shop.face.land) in
// an on-brand purple UI: browse packages here, and Buy Now drives the shop's
// cart + checkout behind the scenes inside a modal (see GemCheckoutModal).
export const Gems = () => {
  const [state] = useContext(Context);
  const [infoPkg, setInfoPkg] = useState(null);
  const [checkoutPkg, setCheckoutPkg] = useState(null);

  // Packages and the sidebar (top donor / recent buys) are pulled live from the
  // shop on each visit, via a CORS proxy — the browser can't read
  // shop.face.land directly. Until that resolves, or if it fails outright, the
  // baked-in snapshot in gemsData.js renders instead.
  const [shop, setShop] = useState(staticShopData);
  useEffect(() => {
    let alive = true;
    fetchLiveShopData()
      .then((live) => {
        if (!alive || !live) return;
        setShop((prev) => ({
          packages: live.packages?.length ? live.packages : prev.packages,
          topDonor: live.topDonor || prev.topDonor,
          recentPurchases: live.recentPurchases?.length
            ? live.recentPurchases
            : prev.recentPurchases,
        }));
      })
      .catch(() => {
        /* keep the fallback */
      });
    return () => {
      alive = false;
    };
  }, []);

  // The gateway returns the buyer to /gems?payment=success|failed. Clearing the
  // param is a history *replace*, so the modal closes without reloading the page
  // and without leaving a back-button entry that would re-open it. Any other
  // query params the gateway tacks on are preserved.
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = paymentStatusFrom(searchParams.get('payment'));
  const clearPayment = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('payment');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

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
        description="Purchase FaceGems for Faceland RPG and spend them on in-game cosmetics and global boosts, and get bonus perks on your first purchase. Pick a package and check out securely."
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
            className="gemsBannerIcon pixelImage"
            src="/assets/images/XAhGG80.png"
            alt=""
            aria-hidden="true"
          />
          <div className="gemsBannerText">
            <h1>Buy FaceGems?!</h1>
            <p>
              The only gem with a face right on it! You can spend FaceGems in-game for cool cosmetics and global boosts! Your first purchase unlocks some exclusive perks!
            </p>
          </div>
        </div>

        <div className="gemGrid">
          {shop.packages.map((pkg) => (
            <GemPackageCard key={pkg.id} pkg={pkg} onInfo={openInfo} onBuy={openCheckout} />
          ))}
        </div>

        <p className="gemsFinePrint">
          Payments are processed securely by CraftingStore. Faceland is not an official Minecraft
          product and is not associated with Mojang or Microsoft.
        </p>
      </div>

      <GemTicker
        topDonor={shop.topDonor}
        recentPurchases={shop.recentPurchases}
        packages={shop.packages}
      />

      {/* TEMP: under-construction notice while testing in production. */}
      <GemConstructionModal />

      <GemResultModal status={paymentStatus} onClose={clearPayment} />

      <GemInfoModal pkg={infoPkg} onClose={closeInfo} onBuy={openCheckout} />
      <GemCheckoutModal pkg={checkoutPkg} onClose={closeCheckout} />

      <DiscordWidget />
      <Footer />
    </div>
  );
};
