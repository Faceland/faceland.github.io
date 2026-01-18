const { createCanvas, loadImage } = require('canvas');

// Texture selections mapping (configId -> image path)
const textureMap = {
  // Backgrounds
  'frame': '/assets/portraits/backgroundOptions/frame.png',
  'plains': '/assets/portraits/backgroundOptions/plains.png',
  'normal-forest': '/assets/portraits/backgroundOptions/normal-forest.png',
  'purple-forest': '/assets/portraits/backgroundOptions/purple-forest.png',
  'birch': '/assets/portraits/backgroundOptions/birch.png',
  'bkg-pasture': '/assets/portraits/backgroundOptions/bkg-pasture.png',
  'bkg-mill': '/assets/portraits/backgroundOptions/bkg-mill.png',
  'windmill': '/assets/portraits/backgroundOptions/windmill.png',
  'bkg-shop': '/assets/portraits/backgroundOptions/bkg-shop.png',
  'bkg-weapons': '/assets/portraits/backgroundOptions/bkg-weapons.png',
  'desert': '/assets/portraits/backgroundOptions/desert.png',
  'desert-ruins': '/assets/portraits/backgroundOptions/desert-ruins.png',
  'desert-pyramid': '/assets/portraits/backgroundOptions/desert-pyramid.png',
  'outpost': '/assets/portraits/backgroundOptions/outpost.png',
  'outpost2': '/assets/portraits/backgroundOptions/outpost2.png',
  'near-island': '/assets/portraits/backgroundOptions/near-island.png',
  'beach': '/assets/portraits/backgroundOptions/beach.png',
  'graveyard': '/assets/portraits/backgroundOptions/graveyard.png',
  'cave1': '/assets/portraits/backgroundOptions/cave1.png',
  'bkg-mushroom': '/assets/portraits/backgroundOptions/bkg-mushroom.png',
  'bkg-swamp': '/assets/portraits/backgroundOptions/bkg-swamp.png',
  'green-swamp': '/assets/portraits/backgroundOptions/green-swamp.png',
  'bkg-swamp3': '/assets/portraits/backgroundOptions/bkg-swamp3.png',
  'pine-path': '/assets/portraits/backgroundOptions/pine-path.png',
  'on-boat': '/assets/portraits/backgroundOptions/on-boat.png',
  'near-baot': '/assets/portraits/backgroundOptions/near-baot.png',
  'thatched': '/assets/portraits/backgroundOptions/thatched.png',
  'castle-wall': '/assets/portraits/backgroundOptions/castle-wall.png',
  'bamboo': '/assets/portraits/backgroundOptions/bamboo.png',
  'snow-and-trees': '/assets/portraits/backgroundOptions/snow-and-trees.png',
  'lava-cave': '/assets/portraits/backgroundOptions/lava-cave.png',
  'jungle-torches': '/assets/portraits/backgroundOptions/jungle-torches.png',
  'library': '/assets/portraits/backgroundOptions/library.png',
  'crossroads': '/assets/portraits/backgroundOptions/crossroads.png',
  'ruins': '/assets/portraits/backgroundOptions/ruins.png',
  'distant-castle': '/assets/portraits/backgroundOptions/distant-castle.png',
  'badlands': '/assets/portraits/backgroundOptions/badlands.png',
  'steve': '/assets/portraits/backgroundOptions/steve.png',
  // Body types
  'base-skin': '/assets/portraits/bodyTypes/base-skin.png',
  'doge-skin': '/assets/portraits/bodyTypes/doge-skin.png',
  'child': '/assets/portraits/bodyTypes/child.png',
  'fuzzy-skin': '/assets/portraits/bodyTypes/fuzzy-skin.png',
  'cow': '/assets/portraits/bodyTypes/cow.png',
  'rabbit1': '/assets/portraits/bodyTypes/rabbit1.png',
  'rabbit2': '/assets/portraits/bodyTypes/rabbit2.png',
  'rabbit3': '/assets/portraits/bodyTypes/rabbit3.png',
  'wolf': '/assets/portraits/bodyTypes/wolf.png',
  'default': '/assets/portraits/bodyTypes/default.png',
  'idiot': '/assets/portraits/bodyTypes/idiot.png',
  'skeleton': '/assets/portraits/bodyTypes/skeleton.png',
  // Clothes
  'long-sleeve-shirt': '/assets/portraits/clothesOptions/long-sleeve-shirt.png',
  'short-sleeve-shirt': '/assets/portraits/clothesOptions/short-sleeve-shirt.png',
  'suspenders': '/assets/portraits/clothesOptions/suspenders.png',
  'overalls': '/assets/portraits/clothesOptions/overalls.png',
  'shawl': '/assets/portraits/clothesOptions/shawl.png',
  'coat-buttons': '/assets/portraits/clothesOptions/coat-buttons.png',
  'bowtie': '/assets/portraits/clothesOptions/bowtie.png',
  'vest-plaid': '/assets/portraits/clothesOptions/vest-plaid.png',
  'shirt-plaid': '/assets/portraits/clothesOptions/shirt-plaid.png',
  'vest': '/assets/portraits/clothesOptions/vest.png',
  'coat': '/assets/portraits/clothesOptions/coat.png',
  'coat-plaid': '/assets/portraits/clothesOptions/coat-plaid.png',
  'backpack-strap': '/assets/portraits/clothesOptions/backpack-strap.png',
  'chest-strap1': '/assets/portraits/clothesOptions/chest-strap1.png',
  'chest-strap2': '/assets/portraits/clothesOptions/chest-strap2.png',
  'chest-medal': '/assets/portraits/clothesOptions/chest-medal.png',
  'collar-v': '/assets/portraits/clothesOptions/collar-v.png',
  'black-overcoat': '/assets/portraits/clothesOptions/black-overcoat.png',
  'bikini': '/assets/portraits/clothesOptions/bikini.png',
  'blouse': '/assets/portraits/clothesOptions/blouse.png',
  'sleeveless-shirt': '/assets/portraits/clothesOptions/sleeveless-shirt.png',
  'medium-armor': '/assets/portraits/clothesOptions/medium-armor.png',
  'heavy-armor': '/assets/portraits/clothesOptions/heavy-armor.png',
  'tie': '/assets/portraits/clothesOptions/tie.png',
  'shoulder-tassels': '/assets/portraits/clothesOptions/shoulder-tassels.png',
  'undertexture-vneck': '/assets/portraits/clothesOptions/undertexture-vneck.png',
  'undertexture-plain': '/assets/portraits/clothesOptions/undertexture-plain.png',
  // Hair
  'hair-afro': '/assets/portraits/hairOptions/hair-afro.png',
  'hair-spiked': '/assets/portraits/hairOptions/hair-spiked.png',
  'hair-messy': '/assets/portraits/hairOptions/hair-messy.png',
  'hair-bangs-long': '/assets/portraits/hairOptions/hair-bangs-long.png',
  'hair-bangs-short': '/assets/portraits/hairOptions/hair-bangs-short.png',
  'hair-eye-covered': '/assets/portraits/hairOptions/hair-eye-covered.png',
  'hair-split-short': '/assets/portraits/hairOptions/hair-split-short.png',
  'hair-split-long': '/assets/portraits/hairOptions/hair-split-long.png',
  // Eyes
  'eyes-plain': '/assets/portraits/eyeOptions/eyes-plain.png',
  'eyes-lashes': '/assets/portraits/eyeOptions/eyes-lashes.png',
  'eyes-lashes-long': '/assets/portraits/eyeOptions/eyes-lashes-long.png',
  'eyes-angry': '/assets/portraits/eyeOptions/eyes-angry.png',
  'pupil-dots': '/assets/portraits/eyeOptions/pupil-dots.png',
  'pupil-normal': '/assets/portraits/eyeOptions/pupil-normal.png',
  'pupil-dark': '/assets/portraits/eyeOptions/pupil-dark.png',
  'eyes-closed': '/assets/portraits/eyeOptions/eyes-closed.png',
  'eyes-sus': '/assets/portraits/eyeOptions/eyes-sus.png',
  'eyes-happy': '/assets/portraits/eyeOptions/eyes-happy.png',
  'eyes-surprised': '/assets/portraits/eyeOptions/eyes-surprised.png',
  'eyes-single-normal': '/assets/portraits/eyeOptions/eyes-single-normal.png',
  'eyes-single-dark': '/assets/portraits/eyeOptions/eyes-single-dark.png',
  'eyebrow-high': '/assets/portraits/eyeOptions/eyebrow-high.png',
  'eyebrow-angry': '/assets/portraits/eyeOptions/eyebrow-angry.png',
  'eyebrow-raised': '/assets/portraits/eyeOptions/eyebrow-raised.png',
  'eyebrow-low': '/assets/portraits/eyeOptions/eyebrow-low.png',
  'eyebrow-concern': '/assets/portraits/eyeOptions/eyebrow-concern.png',
  // Ears
  'ears-human': '/assets/portraits/earOptions/ears-human.png',
  'ears-pointed': '/assets/portraits/earOptions/ears-pointed.png',
  'ears-bunny': '/assets/portraits/earOptions/ears-bunny.png',
  'ears-cat': '/assets/portraits/earOptions/ears-cat.png',
  // Nose
  'nose-small': '/assets/portraits/noseOptions/nose-small.png',
  'nose-large': '/assets/portraits/noseOptions/nose-large.png',
  'nose-long': '/assets/portraits/noseOptions/nose-long.png',
  'nose-round': '/assets/portraits/noseOptions/nose-round.png',
  'nose-villager': '/assets/portraits/noseOptions/nose-villager.png',
  'nose-pig': '/assets/portraits/noseOptions/nose-pig.png',
  'nose-dog': '/assets/portraits/noseOptions/nose-dog.png',
  // Mouth
  'mouth-normal': '/assets/portraits/mouthOptions/mouth-normal.png',
  'mouth-big-smile': '/assets/portraits/mouthOptions/mouth-big-smile.png',
  'mouth-smug': '/assets/portraits/mouthOptions/mouth-smug.png',
  'mouth-blep': '/assets/portraits/mouthOptions/mouth-blep.png',
  'mouth-nervous': '/assets/portraits/mouthOptions/mouth-nervous.png',
  'mouth-shocked': '/assets/portraits/mouthOptions/mouth-shocked.png',
  'mouth-orc': '/assets/portraits/mouthOptions/mouth-orc.png',
  'mouth-orc2': '/assets/portraits/mouthOptions/mouth-orc2.png',
  'mouth-orc3': '/assets/portraits/mouthOptions/mouth-orc3.png',
  'mouth-fang-frown': '/assets/portraits/mouthOptions/mouth-fang-frown.png',
  'mouth-fang-smile': '/assets/portraits/mouthOptions/mouth-fang-smile.png',
  'mouth-fang': '/assets/portraits/mouthOptions/mouth-fang.png',
  'mouth-smile': '/assets/portraits/mouthOptions/mouth-smile.png',
  'mouth-frown': '/assets/portraits/mouthOptions/mouth-frown.png',
  'mouth-cheek': '/assets/portraits/mouthOptions/mouth-cheek.png',
  // Extra hair
  'long-hair': '/assets/portraits/extraHair/long-hair.png',
  'long-braids': '/assets/portraits/extraHair/long-braids.png',
  'shoulder-hair': '/assets/portraits/extraHair/shoulder-hair.png',
  'pony-tail': '/assets/portraits/extraHair/pony-tail.png',
  'moustache': '/assets/portraits/extraHair/moustache.png',
  'handlebar': '/assets/portraits/extraHair/handlebar.png',
  'beard-full': '/assets/portraits/extraHair/beard-full.png',
  'beard-goat': '/assets/portraits/extraHair/beard-goat.png',
  'long-beard': '/assets/portraits/extraHair/long-beard.png',
  // Face options
  'blush': '/assets/portraits/faceOptions/blush.png',
  'single-tear': '/assets/portraits/faceOptions/single-tear.png',
  'crying': '/assets/portraits/faceOptions/crying.png',
  'luffy-scar': '/assets/portraits/faceOptions/luffy-scar.png',
  'head-wound': '/assets/portraits/faceOptions/head-wound.png',
  'face-scratch': '/assets/portraits/faceOptions/face-scratch.png',
  'right-eye-scar': '/assets/portraits/faceOptions/right-eye-scar.png',
  'left-eye-scar': '/assets/portraits/faceOptions/left-eye-scar.png',
  'freckles': '/assets/portraits/faceOptions/freckles.png',
  'freckles2': '/assets/portraits/faceOptions/freckles2.png',
  'face-dirty': '/assets/portraits/faceOptions/face-dirty.png',
  'face-scar-cross1': '/assets/portraits/faceOptions/face-scar-cross1.png',
  'face-scar-cross2': '/assets/portraits/faceOptions/face-scar-cross2.png',
  // Headwear
  'goggles': '/assets/portraits/headwearOptions/goggles.png',
  'hair-bow': '/assets/portraits/headwearOptions/hair-bow.png',
  'hair-flower': '/assets/portraits/headwearOptions/hair-flower.png',
  'straw-hat': '/assets/portraits/headwearOptions/straw-hat.png',
  'naval-cap': '/assets/portraits/headwearOptions/naval-cap.png',
  'medium-hat': '/assets/portraits/headwearOptions/medium-hat.png',
  'large-hat': '/assets/portraits/headwearOptions/large-hat.png',
  'tricorne': '/assets/portraits/headwearOptions/tricorne.png',
  'flower-crown-warm': '/assets/portraits/headwearOptions/flower-crown-warm.png',
  'flower-crown-cool': '/assets/portraits/headwearOptions/flower-crown-cool.png',
  'knight-helm-open': '/assets/portraits/headwearOptions/knight-helm-open.png',
  'knight-helm-closed': '/assets/portraits/headwearOptions/knight-helm-closed.png',
  'headband': '/assets/portraits/headwearOptions/headband.png',
  'hood': '/assets/portraits/headwearOptions/hood.png',
  'hood-trim': '/assets/portraits/headwearOptions/hood-trim.png',
  'monocle': '/assets/portraits/headwearOptions/monocle.png',
  'plague-mask': '/assets/portraits/headwearOptions/plague-mask.png',
  'frog-hat': '/assets/portraits/headwearOptions/frog-hat.png',
  'heavy-helmet': '/assets/portraits/headwearOptions/heavy-helmet.png',
  'templar-helm': '/assets/portraits/headwearOptions/templar-helm.png',
  'templar-helm-trim': '/assets/portraits/headwearOptions/templar-helm-trim.png',
  'eyepatch-left': '/assets/portraits/headwearOptions/eyepatch-left.png',
  'eyepatch-right': '/assets/portraits/headwearOptions/eyepatch-right.png',
  'mouth-toast': '/assets/portraits/headwearOptions/mouth-toast.png',
  'shadow': '/assets/portraits/headwearOptions/shadow.png',
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 255, g: 255, b: 255 };
}

function tintImage(ctx, image, color, x, y, width, height) {
  // Draw original image to get pixel data
  const tempCanvas = createCanvas(width, height);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(image, 0, 0, width, height);

  const imageData = tempCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply tint by multiplying each pixel by the color
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.floor(data[i] * color.r / 255);     // R
    data[i + 1] = Math.floor(data[i + 1] * color.g / 255); // G
    data[i + 2] = Math.floor(data[i + 2] * color.b / 255); // B
    // Alpha stays the same
  }

  tempCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(tempCanvas, x, y, width, height);
}

module.exports = async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      res.status(400).json({ error: 'Missing data parameter' });
      return;
    }

    // Parse the data parameter
    const layers = data.split('~');
    const parsedLayers = [];

    for (const layer of layers) {
      const parts = layer.split('_');
      const configId = parts[0];
      const hexColor = parts.length > 1 ? '#' + parts[1] : '#FFFFFF';

      if (textureMap[configId]) {
        parsedLayers.push({
          configId,
          imagePath: textureMap[configId],
          color: hexToRgb(hexColor),
        });
      }
    }

    if (parsedLayers.length === 0) {
      res.status(400).json({ error: 'No valid layers found' });
      return;
    }

    // Create canvas (52x52 native, scaled up for OG image)
    const scale = 8;
    const width = 52 * scale;
    const height = 52 * scale;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Disable image smoothing for pixel art
    ctx.imageSmoothingEnabled = false;

    // Get the base URL for loading images
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://faceland.github.io';

    // Load and draw each layer
    for (const layer of parsedLayers) {
      try {
        const imageUrl = `${baseUrl}${layer.imagePath}`;
        const image = await loadImage(imageUrl);
        tintImage(ctx, image, layer.color, 0, 0, width, height);
      } catch (err) {
        console.error(`Failed to load image: ${layer.imagePath}`, err);
      }
    }

    // Return the image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(canvas.toBuffer('image/png'));

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
};
