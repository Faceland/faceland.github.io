module.exports = async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /bot|crawler|spider|crawling|facebookexternalhit|Twitterbot|Discord|Slack|LinkedIn|WhatsApp|Telegram/i.test(userAgent);

  const data = req.query.data || '';
  const spaUrl = `https://face.land/facepals${data ? `?data=${encodeURIComponent(data)}` : ''}`;

  // For regular users, redirect to the SPA
  if (!isBot) {
    res.setHeader('Location', spaUrl);
    res.status(307).end();
    return;
  }

  // For bots, serve HTML with OG meta tags
  const ogImageUrl = data
    ? `https://face.land/api/og-image?data=${encodeURIComponent(data)}`
    : 'https://face.land/assets/images/default-portrait.png';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Faceland Portrait Creator</title>
  <meta property="og:title" content="Faceland Portrait Creator" />
  <meta property="og:description" content="Create and share custom character portraits for Faceland RPG!" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="416" />
  <meta property="og:image:height" content="416" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${spaUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Faceland Portrait Creator" />
  <meta name="twitter:description" content="Create and share custom character portraits for Faceland RPG!" />
  <meta name="twitter:image" content="${ogImageUrl}" />
</head>
<body>
  <p>Faceland Portrait Creator - Loading...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
};
