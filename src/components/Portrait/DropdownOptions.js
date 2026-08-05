import { v4 as uuidv4 } from 'uuid';

export const textureSelections = [
  {
    option: { value: 'backgroundOptions', label: '🗺️' },
    textures: [
      { value: '/assets/portraits/backgroundOptions/frame.png', configId: 'frame', label: 'Frame'},
      { value: '/assets/portraits/backgroundOptions/plains.png', configId: 'plains', label: 'Plains'},
      { value: '/assets/portraits/backgroundOptions/normal-forest.png', configId: 'normal-forest', label: 'Forest'},
      { value: '/assets/portraits/backgroundOptions/purple-forest.png', configId: 'purple-forest', label: 'Forest 2'},
      { value: '/assets/portraits/backgroundOptions/birch.png', configId: 'birch', label: 'Birch Forest'},
      { value: '/assets/portraits/backgroundOptions/bkg-pasture.png', configId: 'bkg-pasture', label: 'Pasture'},
      { value: '/assets/portraits/backgroundOptions/bkg-mill.png', configId: 'bkg-mill', label: 'Water Mill'},
      { value: '/assets/portraits/backgroundOptions/windmill.png', configId: 'windmill', label: 'Grain Mill'},
      { value: '/assets/portraits/backgroundOptions/bkg-shop.png', configId: 'bkg-shop', label: 'Shop'},
      { value: '/assets/portraits/backgroundOptions/bkg-weapons.png', configId: 'bkg-weapons', label: 'Blacksmith'},
      { value: '/assets/portraits/backgroundOptions/desert.png', configId: 'desert', label: 'Desert'},
      { value: '/assets/portraits/backgroundOptions/desert-ruins.png', configId: 'desert-ruins', label: 'Desert Ruins'},
      { value: '/assets/portraits/backgroundOptions/desert-pyramid.png', configId: 'desert-pyramid', label: 'Desert Pyramid'},
      { value: '/assets/portraits/backgroundOptions/outpost.png', configId: 'outpost', label: 'Outpost'},
      { value: '/assets/portraits/backgroundOptions/outpost2.png', configId: 'outpost2', label: 'Outpost 2'},
      { value: '/assets/portraits/backgroundOptions/near-island.png', configId: 'near-island', label: 'Tropical Island'},
      { value: '/assets/portraits/backgroundOptions/beach.png', configId: 'beach', label: 'Beach'},
      { value: '/assets/portraits/backgroundOptions/graveyard.png', configId: 'graveyard', label: 'Graveyard'},
      { value: '/assets/portraits/backgroundOptions/cave1.png', configId: 'cave1', label: 'Cave'},
      { value: '/assets/portraits/backgroundOptions/bkg-mushroom.png', configId: 'bkg-mushroom', label: 'Mushroom Cave'},
      { value: '/assets/portraits/backgroundOptions/bkg-swamp.png', configId: 'bkg-swamp', label: 'Swamp'},
      { value: '/assets/portraits/backgroundOptions/green-swamp.png', configId: 'green-swamp', label: 'Swamp 2'},
      { value: '/assets/portraits/backgroundOptions/bkg-swamp3.png', configId: 'bkg-swamp3', label: 'Lily Pad Swamp'},
      { value: '/assets/portraits/backgroundOptions/pine-path.png', configId: 'pine-path', label: 'Pine Path'},
      { value: '/assets/portraits/backgroundOptions/on-boat.png', configId: 'on-boat', label: 'Sailing'},
      { value: '/assets/portraits/backgroundOptions/near-baot.png', configId: 'near-baot', label: 'Dock And Ship'},
      { value: '/assets/portraits/backgroundOptions/thatched.png', configId: 'thatched', label: 'Huts'},
      { value: '/assets/portraits/backgroundOptions/castle-wall.png', configId: 'castle-wall', label: 'Castle Hall'},
      { value: '/assets/portraits/backgroundOptions/bamboo.png', configId: 'bamboo', label: 'Bamboo'},
      { value: '/assets/portraits/backgroundOptions/snow-and-trees.png', configId: 'snow-and-trees', label: 'Snow And Trees'},
      { value: '/assets/portraits/backgroundOptions/lava-cave.png', configId: 'lava-cave', label: 'Lava Cave'},
      { value: '/assets/portraits/backgroundOptions/jungle-torches.png', configId: 'jungle-torches', label: 'Jungle Torches'},
      { value: '/assets/portraits/backgroundOptions/library.png', configId: 'library', label: 'Library'},
      { value: '/assets/portraits/backgroundOptions/crossroads.png', configId: 'crossroads', label: 'Crossroads'},
      { value: '/assets/portraits/backgroundOptions/ruins.png', configId: 'ruins', label: 'Ruins'},
      { value: '/assets/portraits/backgroundOptions/distant-castle.png', configId: 'distant-castle', label: 'Distant Castle'},
      { value: '/assets/portraits/backgroundOptions/badlands.png', configId: 'badlands', label: 'Badlands'},
      { value: '/assets/portraits/backgroundOptions/steve.png', configId: 'steve', label: 'Golfing'}
    ],
  },
  {
    option: { value: 'bodyTypes', label: '🧍' },
    textures: [
      { value: '/assets/portraits/bodyTypes/base-skin.png', configId: 'base-skin', label: 'Basic' },
      { value: '/assets/portraits/bodyTypes/doge-skin.png', configId: 'doge-skin', label: 'Doge' },
      { value: '/assets/portraits/bodyTypes/child.png', configId: 'child', label: 'Child' },
      { value: '/assets/portraits/bodyTypes/fuzzy-skin.png', configId: 'fuzzy-skin', label: 'Fuzzy' },
      { value: '/assets/portraits/bodyTypes/cow.png', configId: 'cow', label: 'Cow' },
      { value: '/assets/portraits/bodyTypes/rabbit1.png', configId: 'rabbit1', label: 'Rabbit' },
      { value: '/assets/portraits/bodyTypes/rabbit2.png', configId: 'rabbit2', label: 'Rabbit 2' },
      { value: '/assets/portraits/bodyTypes/rabbit3.png', configId: 'rabbit3', label: 'Rabbit 3' },
      { value: '/assets/portraits/bodyTypes/wolf.png', configId: 'wolf', label: 'Wolf' },
      { value: '/assets/portraits/bodyTypes/default.png', configId: 'default', label: '?' },
      { value: '/assets/portraits/bodyTypes/idiot.png', configId: 'idiot', label: 'Idiot' },
      { value: '/assets/portraits/bodyTypes/skeleton.png', configId: 'skeleton', label: 'Skellington' },
      { value: '/assets/portraits/bodyTypes/skeleton.png', configId: 'skeleton', label: 'Skellington (HAT)' },
    ],
  },
  {
    option: { value: 'clothesOptions', label: '👗' },
    textures: [
      { value: '/assets/portraits/clothesOptions/long-sleeve-shirt.png', configId: 'long-sleeve-shirt', label: 'Long Sleeve Shirt' },
      { value: '/assets/portraits/clothesOptions/short-sleeve-shirt.png', configId: 'short-sleeve-shirt', label: 'Short Sleeve Shirt' },
      { value: '/assets/portraits/clothesOptions/suspenders.png', configId: 'suspenders', label: 'Suspenders' },
      { value: '/assets/portraits/clothesOptions/overalls.png', configId: 'overalls', label: 'Overalls' },
      { value: '/assets/portraits/clothesOptions/shawl.png', configId: 'shawl', label: 'Shawl/Scarf' },
      { value: '/assets/portraits/clothesOptions/coat-buttons.png', configId: 'coat-buttons', label: 'Coat Buttons' },
      { value: '/assets/portraits/clothesOptions/bowtie.png', configId: 'bowtie', label: 'Bowtie' },
      { value: '/assets/portraits/clothesOptions/vest-plaid.png', configId: 'vest-plaid', label: 'Plaid Vest' },
      { value: '/assets/portraits/clothesOptions/shirt-plaid.png', configId: 'shirt-plaid', label: 'Plaid Shirt' },
      { value: '/assets/portraits/clothesOptions/vest.png', configId: 'vest', label: 'Vest' },
      { value: '/assets/portraits/clothesOptions/coat.png', configId: 'coat', label: 'Coat' },
      { value: '/assets/portraits/clothesOptions/coat-plaid.png', configId: 'coat-plaid', label: 'Coat (Plaid)' },
      { value: '/assets/portraits/clothesOptions/backpack-strap.png', configId: 'backpack-strap', label: 'Backpack Strap' },
      { value: '/assets/portraits/clothesOptions/chest-strap1.png', configId: 'chest-strap1', label: 'Chest Strap' },
      { value: '/assets/portraits/clothesOptions/chest-strap2.png', configId: 'chest-strap2', label: 'Chest Strap 2)' },
      { value: '/assets/portraits/clothesOptions/chest-medal.png', configId: 'chest-medal', label: 'Chest Medal' },
      { value: '/assets/portraits/clothesOptions/collar-v.png', configId: 'collar-v', label: 'V Collar' },
      { value: '/assets/portraits/clothesOptions/black-overcoat.png', configId: 'black-overcoat', label: 'Black Overcoat' },
      { value: '/assets/portraits/clothesOptions/bikini.png', configId: 'bikini', label: 'Bikini' },
      { value: '/assets/portraits/clothesOptions/blouse.png', configId: 'blouse', label: 'Blouse' },
      { value: '/assets/portraits/clothesOptions/sleeveless-shirt.png', configId: 'sleeveless-shirt', label: 'Sleeveless Shirt' },
      { value: '/assets/portraits/clothesOptions/medium-armor.png', configId: 'medium-armor', label: 'Medium Armor' },
      { value: '/assets/portraits/clothesOptions/heavy-armor.png', configId: 'heavy-armor', label: 'Clothes (Heavy Armor)' },
      { value: '/assets/portraits/clothesOptions/tie.png', configId: 'tie', label: 'Tie' },
      { value: '/assets/portraits/clothesOptions/shoulder-tassels.png', configId: 'shoulder-tassels', label: 'Shoulder Tassels' },
      { value: '/assets/portraits/clothesOptions/undertexture-vneck.png', configId: 'undertexture-vneck', label: 'Undertexture (Vneck)' },
      { value: '/assets/portraits/clothesOptions/undertexture-plain.png', configId: 'undertexture-plain', label: 'Undertexture (Plain)' }
    ],
  },
  {
    option: { value: 'hairOptions', label: '💇' },
    textures: [
      {  value: '/assets/portraits/hairOptions/hair-afro.png',  configId: 'hair-afro',  label: 'Hair (Afro)' },
      {  value: '/assets/portraits/hairOptions/hair-spiked.png',  configId: 'hair-spiked',  label: 'Hair (Spiked)' },
      {  value: '/assets/portraits/hairOptions/hair-messy.png',  configId: 'hair-messy',  label: 'Hair (Messy)' },
      {  value: '/assets/portraits/hairOptions/hair-bangs-long.png',  configId: 'hair-bangs-long',  label: 'Hair (Long Bangs)' },
      {  value: '/assets/portraits/hairOptions/hair-bangs-short.png',  configId: 'hair-bangs-short',  label: 'Hair (Short Bangs)' },
      {  value: '/assets/portraits/hairOptions/hair-eye-covered.png',  configId: 'hair-eye-covered',  label: 'Hair (Eye Covered)' },
      {  value: '/assets/portraits/hairOptions/hair-split-short.png',  configId: 'hair-split-short',  label: 'Hair (Split Short)' },
      {  value: '/assets/portraits/hairOptions/hair-split-long.png',  configId: 'hair-split-long',  label: 'Hair (Split Long)' },
    ],
  },
  {
    option: { value: 'eyeOptions', label: '👀️' },
    textures: [
      {  value: '/assets/portraits/eyeOptions/eyes-plain.png',  configId: 'eyes-plain',  label: 'Plain' },
      {  value: '/assets/portraits/eyeOptions/eyes-lashes.png',  configId: 'eyes-lashes',  label: 'Medium Lashes' },
      {  value: '/assets/portraits/eyeOptions/eyes-lashes-long.png',  configId: 'eyes-lashes-long',  label: 'Long Lashes' },
      {  value: '/assets/portraits/eyeOptions/eyes-angry.png',  configId: 'eyes-angry',  label: 'Angry' },

      {  value: '/assets/portraits/eyeOptions/pupil-dots.png',  configId: 'pupil-dots',  label: 'Dot Pupils' },
      {  value: '/assets/portraits/eyeOptions/pupil-normal.png',  configId: 'pupil-normal',  label: 'Pupils' },
      {  value: '/assets/portraits/eyeOptions/pupil-dark.png',  configId: 'pupil-dark',  label: 'Dark Pupils' },

      {  value: '/assets/portraits/eyeOptions/eyes-closed.png',  configId: 'eyes-closed',  label: 'Closed' },
      {  value: '/assets/portraits/eyeOptions/eyes-sus.png',  configId: 'eyes-sus',  label: 'Sus' },
      {  value: '/assets/portraits/eyeOptions/eyes-happy.png',  configId: 'eyes-happy',  label: 'Happy' },
      {  value: '/assets/portraits/eyeOptions/eyes-surprised.png',  configId: 'eyes-surprised',  label: 'Surprised' },

      {  value: '/assets/portraits/eyeOptions/eyes-single-normal.png',  configId: 'eyes-single-normal',  label: 'Single Plain' },
      {  value: '/assets/portraits/eyeOptions/eyes-single-dark.png',  configId: 'eyes-single-dark',  label: 'Single Dark' },

      {  value: '/assets/portraits/eyeOptions/eyebrow-high.png',  configId: 'eyebrow-high',  label: 'Normal Eyebrows' },
      {  value: '/assets/portraits/eyeOptions/eyebrow-angry.png',  configId: 'eyebrow-angry',  label: 'Angry Eyebrows' },
      {  value: '/assets/portraits/eyeOptions/eyebrow-raised.png',  configId: 'eyebrow-raised',  label: 'Raised Eyebrow' },
      {  value: '/assets/portraits/eyeOptions/eyebrow-low.png',  configId: 'eyebrow-low',  label: 'Low Eyebrows' },
      {  value: '/assets/portraits/eyeOptions/eyebrow-concern.png',  configId: 'eyebrow-concern',  label: 'Concerned Eyebrows' },
    ],
  },
  {
    option: { value: 'earOptions', label: '👂' },
    textures: [
      { value: '/assets/portraits/earOptions/ears-human.png', configId: 'ears-human', label: 'Normal' },
      { value: '/assets/portraits/earOptions/ears-pointed.png', configId: 'ears-pointed', label: 'Pointed' },
      { value: '/assets/portraits/earOptions/ears-bunny.png', configId: 'ears-bunny', label: 'Bunny' },
      { value: '/assets/portraits/earOptions/ears-cat.png', configId: 'ears-cat', label: 'Cat' }
    ],
  },
  {
    option: { value: 'noseOptions', label: '👃' },
    textures: [
      {  value: '/assets/portraits/noseOptions/nose-small.png',  configId: 'nose-small',  label: 'Normal' },
      //{value: '/assets/portraits/noseOptions/nose-medium.png', configId: "nose-medium", label: 'Nose (Medium)'},
      {  value: '/assets/portraits/noseOptions/nose-large.png',  configId: 'nose-large',  label: 'Large' },
      {  value: '/assets/portraits/noseOptions/nose-long.png',  configId: 'nose-long',  label: 'Long' },
      {  value: '/assets/portraits/noseOptions/nose-round.png',  configId: 'nose-round',  label: 'Round' },
      {  value: '/assets/portraits/noseOptions/nose-villager.png',  configId: 'nose-villager',  label: 'Villager' },
      {  value: '/assets/portraits/noseOptions/nose-pig.png',  configId: 'nose-pig',  label: 'Pig' },
      {  value: '/assets/portraits/noseOptions/nose-dog.png',  configId: 'nose-dog',  label: 'Dog' },
    ],
  },
  {
    option: { value: 'mouthOptions', label: '👄' },
    textures: [
      {  value: '/assets/portraits/mouthOptions/mouth-normal.png',  configId: 'mouth-normal',  label: 'Neutral' },
      {  value: '/assets/portraits/mouthOptions/mouth-big-smile.png',  configId: 'mouth-big-smile',  label: 'Big Smile' },
      {  value: '/assets/portraits/mouthOptions/mouth-smug.png',  configId: 'mouth-smug',  label: 'Smug' },
      {  value: '/assets/portraits/mouthOptions/mouth-blep.png',  configId: 'mouth-blep',  label: 'Blep' },
      {  value: '/assets/portraits/mouthOptions/mouth-nervous.png',  configId: 'mouth-nervous',  label: 'Nervous' },
      {  value: '/assets/portraits/mouthOptions/mouth-shocked.png',  configId: 'mouth-shocked',  label: 'Shocked' },
      {  value: '/assets/portraits/mouthOptions/mouth-orc.png',  configId: 'mouth-orc',  label: 'Orc' },
      {  value: '/assets/portraits/mouthOptions/mouth-orc2.png',  configId: 'mouth-orc2',  label: 'Ogre' },
      {  value: '/assets/portraits/mouthOptions/mouth-orc3.png',  configId: 'mouth-orc3',  label: 'Ogre 2' },
      {  value: '/assets/portraits/mouthOptions/mouth-fang-frown.png',  configId: 'mouth-fang-frown',  label: 'Fanged Frown' },
      {  value: '/assets/portraits/mouthOptions/mouth-fang-smile.png',  configId: 'mouth-fang-smile',  label: 'Fanged Smile' },
      {  value: '/assets/portraits/mouthOptions/mouth-fang.png',  configId: 'mouth-fang',  label: 'Fangs' },
      {  value: '/assets/portraits/mouthOptions/mouth-smile.png',  configId: 'mouth-smile',  label: 'Smile' },
      {  value: '/assets/portraits/mouthOptions/mouth-frown.png',  configId: 'mouth-frown',  label: 'Frown' },
      {  value: '/assets/portraits/mouthOptions/mouth-cheek.png',  configId: 'mouth-cheek',  label: 'Cheek' },
    ],
  },
  {
    option: { value: 'extraHair', label: '🧔️' },
    textures: [
      {  value: '/assets/portraits/extraHair/long-hair.png',  configId: 'long-hair',  label: 'Hair Extension' },
      {  value: '/assets/portraits/extraHair/long-braids.png',  configId: 'long-braids',  label: 'Hair Extension (Braids)' },
      {  value: '/assets/portraits/extraHair/shoulder-hair.png',  configId: 'shoulder-hair',  label: 'Hair Extension (Shoulder)' },
      {  value: '/assets/portraits/extraHair/pony-tail.png',  configId: 'pony-tail',  label: 'Ponytail' },
      {  value: '/assets/portraits/extraHair/moustache.png',  configId: 'moustache',  label: 'Moustache' },
      {  value: '/assets/portraits/extraHair/handlebar.png',  configId: 'handlebar',  label: 'Handlebar' },
      {  value: '/assets/portraits/extraHair/beard-full.png',  configId: 'beard-full',  label: 'Beard' },
      {  value: '/assets/portraits/extraHair/beard-goat.png',  configId: 'beard-goat',  label: 'Goatee' },
      {  value: '/assets/portraits/extraHair/long-beard.png',  configId: 'long-beard',  label: 'Long Beard' },
    ],
  },
  {
    option: { value: 'faceOptions', label: '😀' },
    textures: [
      {  value: '/assets/portraits/faceOptions/blush.png',  configId: 'blush',  label: 'Blush' },
      {  value: '/assets/portraits/faceOptions/single-tear.png',  configId: 'single-tear',  label: 'Crying (Single)' },
      {  value: '/assets/portraits/faceOptions/crying.png',  configId: 'crying',  label: 'Crying (Normal)' },
      {  value: '/assets/portraits/faceOptions/luffy-scar.png',  configId: 'luffy-scar',  label: 'Scar (Luffy)' },
      {  value: '/assets/portraits/faceOptions/head-wound.png',  configId: 'head-wound',  label: 'Scar (Head)' },
      {  value: '/assets/portraits/faceOptions/face-scratch.png',  configId: 'face-scratch',  label: 'Scar (face)' },
      {  value: '/assets/portraits/faceOptions/right-eye-scar.png',  configId: 'right-eye-scar',  label: 'Eye Scar (Right)' },
      {  value: '/assets/portraits/faceOptions/left-eye-scar.png',  configId: 'left-eye-scar',  label: 'Eye Scar (Left)' },
      {  value: '/assets/portraits/faceOptions/freckles.png',  configId: 'freckles',  label: 'Freckles 1' },
      {  value: '/assets/portraits/faceOptions/freckles2.png',  configId: 'freckles2',  label: 'Freckles 2' },
      {  value: '/assets/portraits/faceOptions/face-dirty.png',  configId: 'face-dirty',  label: 'Dirty Face' },
      {  value: '/assets/portraits/faceOptions/face-scar-cross1.png',  configId: 'face-scar-cross1',  label: 'Cross Scar 1' },
      {  value: '/assets/portraits/faceOptions/face-scar-cross2.png',  configId: 'face-scar-cross2',  label: 'Cross Scar 2' },
    ],
  },
  {
    option: { value: 'headwearOptions', label: '🎩' },
    textures: [
      { value: '/assets/portraits/headwearOptions/goggles.png', configId: 'goggles', label: 'Goggles' },
      { value: '/assets/portraits/headwearOptions/hair-bow.png', configId: 'hair-bow', label: 'Hair Bow' },
      { value: '/assets/portraits/headwearOptions/hair-flower.png', configId: 'hair-flower', label: 'Hair Flower' },
      { value: '/assets/portraits/headwearOptions/straw-hat.png', configId: 'straw-hat', label: 'Straw Hat' },
      { value: '/assets/portraits/headwearOptions/naval-cap.png', configId: 'naval-cap', label: 'Naval Cap' },
      { value: '/assets/portraits/headwearOptions/medium-hat.png', configId: 'medium-hat', label: 'Small Top Hat' },
      { value: '/assets/portraits/headwearOptions/large-hat.png', configId: 'large-hat', label: 'Top Hat' },
      { value: '/assets/portraits/headwearOptions/tricorne.png', configId: 'tricorne', label: 'Tricorne' },
      { value: '/assets/portraits/headwearOptions/flower-crown-warm.png', configId: 'flower-crown-warm', label: 'Flower Crown (Warm)' },
      { value: '/assets/portraits/headwearOptions/flower-crown-cool.png', configId: 'flower-crown-cool', label: 'Flower Crown (Cool)' },
      { value: '/assets/portraits/headwearOptions/knight-helm-open.png', configId: 'knight-helm-open', label: 'Knight Helm (Open)' },
      { value: '/assets/portraits/headwearOptions/knight-helm-closed.png', configId: 'knight-helm-closed', label: 'Knight Helm (Closed)' },
      { value: '/assets/portraits/headwearOptions/headband.png', configId: 'headband', label: 'Headband' },
      { value: '/assets/portraits/headwearOptions/hood.png', configId: 'hood', label: 'Hood' },
      { value: '/assets/portraits/headwearOptions/hood-trim.png', configId: 'hood-trim', label: 'Hood Trim' },
      { value: '/assets/portraits/headwearOptions/monocle.png', configId: 'monocle', label: 'Monocle' },
      { value: '/assets/portraits/headwearOptions/plague-mask.png', configId: 'plague-mask', label: 'Plague Mask' },
      { value: '/assets/portraits/headwearOptions/frog-hat.png', configId: 'frog-hat', label: 'Frog Hat' },
      { value: '/assets/portraits/headwearOptions/heavy-helmet.png', configId: 'heavy-helmet', label: 'Heavy Helmet' },
      { value: '/assets/portraits/headwearOptions/templar-helm.png', configId: 'templar-helm', label: 'Templar Helmet' },
      { value: '/assets/portraits/headwearOptions/templar-helm-trim.png', configId: 'templar-helm-trim', label: 'Templar Helmet (Trim)' },
      { value: '/assets/portraits/headwearOptions/eyepatch-left.png', configId: 'eyepatch-left', label: 'Eyepatch L' },
      { value: '/assets/portraits/headwearOptions/eyepatch-right.png', configId: 'eyepatch-right', label: 'Eyepatch R' },
      { value: '/assets/portraits/headwearOptions/mouth-toast.png', configId: 'mouth-toast', label: 'Late For School' },
      { value: '/assets/portraits/headwearOptions/shadow.png', configId: 'shadow', label: 'Veiled Face' }
    ],
  },
];

export const getOptions = () => {
  const options = [];
  for (let obj of textureSelections) {
    options.push(obj.option);
  }
  return options;
};

export const getSelections = (option) => {
  for (let obj of textureSelections) {
    if (obj.option.value === option.value) {
      return obj.textures;
    }
  }
  return null;
};

export const getDataFromConfigId = (configId) => {
  for (let obj of textureSelections) {
    for (let texture of obj.textures) {
      if (texture.configId === configId) {
        return { option: obj.option, selection: texture };
      }
    }
  }
  return null;
};

export const defaultChoices = [
  {
    id: uuidv4(),
    color: { rgb: { r: 216, g: 255, b: 178, a: 1 }, hex: '#D8FFB2' },
    options: { value: 'backgroundOptions', label: '🗺️' },
    selection: {
      value: '/assets/portraits/backgroundOptions/plains.png',
      configId: 'plains',
      label: 'Plains',
    },
  },
  {
    id: uuidv4(),
    color: { rgb: { r: 255, g: 242, b: 224, a: 1 }, hex: '#FFF2E0' },
    options: { value: 'bodyTypes', label: '🧍' },
    selection: {
      value: '/assets/portraits/bodyTypes/base-skin.png',
      configId: 'base-skin',
      label: 'Body (Basic)',
    },
  },
  {
    id: uuidv4(),
    color: { rgb: { r: 209, g: 37, b: 58, a: 1 }, hex: '#D1253A' },
    options: { value: 'clothesOptions', label: '👗' },
    selection: {
      value: '/assets/portraits/clothesOptions/short-sleeve-shirt.png',
      configId: 'short-sleeve-shirt',
      label: 'Short Sleeve Shirt',
    },
  },
  {
    id: uuidv4(),
    color: { rgb: { r: 255, g: 255, b: 255, a: 1 }, hex: '#ffffff' },
    options: { value: 'eyeOptions', label: '👀️' },
    selection: {
      value: '/assets/portraits/eyeOptions/eyes-plain.png',
      configId: 'eyes-plain',
      label: 'Eyes (Plain)',
    },
  },
  {
    id: uuidv4(),
    color: { rgb: { r: 92, g: 171, b: 255, a: 1 }, hex: '#5CABFF' },
    options: { value: 'eyeOptions', label: '👀️' },
    selection: {
      value: '/assets/portraits/eyeOptions/pupil-normal.png',
      configId: 'pupil-normal',
      label: 'Pupils (Normal)',
    },
  },
];
