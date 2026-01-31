import { useEffect } from 'react';

export const SEO = ({ title, description }) => {
  useEffect(() => {
    // Get the current page URL for canonical and OG tags
    const currentUrl = window.location.href.split('?')[0]; // Remove query params
    const canonicalUrl = currentUrl.replace(/\/$/, ''); // Remove trailing slash

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
  }, [title, description]);

  return null;
};
