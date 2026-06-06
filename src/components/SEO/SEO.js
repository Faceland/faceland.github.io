import { useEffect } from 'react';

// Fixed production origin. We must NOT derive this from window.location, because
// react-snap pre-renders these pages inside a headless browser running on
// http://localhost:45678. Using the live origin baked a "localhost" canonical /
// og:url into the static HTML, which made Google treat each real page as a
// duplicate of an unreachable URL and drop it from the index.
const SITE_ORIGIN = 'https://face.land';

export const SEO = ({ title, description }) => {
  useEffect(() => {
    // Build the canonical from the fixed origin + the current path so it is
    // correct both during pre-render and in the live browser.
    const path = window.location.pathname;
    const cleanPath = path === '/' ? '/' : path.replace(/\/+$/, ''); // home keeps "/", others drop trailing slash
    const canonicalUrl = `${SITE_ORIGIN}${cleanPath}`;

    // Update document title
    document.title = title
      ? `${title} | Faceland RPG - Minecraft MMORPG`
      : 'Faceland RPG - Free Minecraft MMORPG Server';

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description);
    }

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    // Update OG URL
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    }

    // Update OG title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute(
        'content',
        title
          ? `${title} | Faceland RPG`
          : 'Faceland RPG - Free Minecraft MMORPG Server',
      );
    }

    // Update OG description
    const ogDescription = document.querySelector(
      'meta[property="og:description"]',
    );
    if (ogDescription && description) {
      ogDescription.setAttribute('content', description);
    }

    // Update Twitter URL
    const twitterUrl = document.querySelector('meta[name="twitter:url"]');
    if (twitterUrl) {
      twitterUrl.setAttribute('content', canonicalUrl);
    }

    // Update Twitter title
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute(
        'content',
        title
          ? `${title} | Faceland RPG`
          : 'Faceland RPG - Free Minecraft MMORPG Server',
      );
    }

    // Update Twitter description
    const twitterDescription = document.querySelector(
      'meta[name="twitter:description"]',
    );
    if (twitterDescription && description) {
      twitterDescription.setAttribute('content', description);
    }

    // Update OG image dimensions (ensure they're set for all pages)
    const ogImageWidth = document.querySelector('meta[property="og:image:width"]');
    if (ogImageWidth) {
      ogImageWidth.setAttribute('content', '512');
    }
    const ogImageHeight = document.querySelector('meta[property="og:image:height"]');
    if (ogImageHeight) {
      ogImageHeight.setAttribute('content', '512');
    }
  }, [title, description]);

  return null;
};
