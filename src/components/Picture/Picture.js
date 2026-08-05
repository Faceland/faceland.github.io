import React from 'react';

/**
 * Picture component that serves WebP with PNG/JPG fallback
 * Automatically looks for .webp version of the image in the same directory
 *
 * @param {string} src - The original image source (e.g., "/assets/images/logo.png")
 * @param {string} alt - Alt text for the image
 * @param {string} [className] - Optional CSS class
 * @param {object} [style] - Optional inline styles
 * @param {string} [loading] - Loading strategy ("lazy" | "eager")
 * @param {object} [rest] - Any other props to pass to the img element
 */
export const Picture = ({ src, alt, className, style, loading, ...rest }) => {
  // Don't process external URLs
  if (src?.startsWith('http://') || src?.startsWith('https://')) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        {...rest}
      />
    );
  }

  // Generate WebP source path
  const webpSrc = src?.replace(/\.(png|jpg|jpeg)$/i, '.webp');

  // Determine the MIME type of the fallback
  const fallbackType = src?.match(/\.jpe?g$/i) ? 'image/jpeg' : 'image/png';

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <source srcSet={src} type={fallbackType} />
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        {...rest}
      />
    </picture>
  );
};

export default Picture;
