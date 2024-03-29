import { v4 as uuidv4 } from 'uuid';

export const textureSelections = [
  {
    option: { value: 'backgroundOptions', label: '🗺️' },
    textures: [
      {
        value: 'https://i.imgur.com/7cmrX2x.png',
        configId: 'frame',
        label: 'Frame',
      },
      {
        value: 'https://i.imgur.com/FrLUEev.png',
        configId: 'tree1',
        label: 'Tree 1',
      },
      {
        value: 'https://i.imgur.com/TG8Ophr.png',
        configId: 'bkg-weapons',
        label: 'Weapons',
      },
      {
        value: 'https://i.imgur.com/ht2XZLY.png',
        configId: 'bkg-mushroom',
        label: 'Mushroom',
      },
      {
        value: 'https://i.imgur.com/pY8YId2.png',
        configId: 'cave1',
        label: 'Cave 1',
      },
      {
        value: 'https://i.imgur.com/PoCPliV.png',
        configId: 'bkg-swamp',
        label: 'Swamp',
      },
      {
        value: 'https://i.imgur.com/aGkTWZI.png',
        configId: 'bkg-shop',
        label: 'Shop',
      },
      {
        value: 'https://i.imgur.com/8gPg6yi.png',
        configId: 'bkg-pasture',
        label: 'Pasture',
      },
      {
        value: 'https://i.imgur.com/Lku2mDn.png',
        configId: 'bkg-mill',
        label: 'Mill',
      },
      {
        value: 'https://i.imgur.com/KTtER0K.png',
        configId: 'windmill',
        label: 'Windmill',
      },
      {
        value: 'https://i.imgur.com/UJHThcd.png',
        configId: 'desert',
        label: 'Desert',
      },
      {
        value: 'https://i.imgur.com/2iyquL8.png',
        configId: 'desert-ruins',
        label: 'Desert Ruins',
      },
      {
        value: 'https://i.imgur.com/ZMyGm06.png',
        configId: 'forest',
        label: 'Forest',
      },
      {
        value: 'https://i.imgur.com/yWk0MK5.png',
        configId: 'outpost',
        label: 'Outpost',
      },
      {
        value: 'https://i.imgur.com/7Qo6BTl.png',
        configId: 'mountain',
        label: 'Mountain',
      },
      {
        value: 'https://i.imgur.com/QPpHgJc.png',
        configId: 'plains',
        label: 'Plains',
      },
    ],
  },
  {
    option: { value: 'bodyTypes', label: '🧍' },
    textures: [
      {
        value: 'https://i.imgur.com/h5EdwQL.png',
        configId: 'base-skin',
        label: 'Basic',
      },
      {
        value: 'https://i.imgur.com/muPpnGU.png',
        configId: 'doge-skin',
        label: 'Doge',
      },
      {
        value: 'https://i.imgur.com/Alt7lbH.png',
        configId: 'fuzzy-skin',
        label: 'Fuzzy',
      },
    ],
  },
  {
    option: { value: 'clothesOptions', label: '👗' },
    textures: [
      {
        value: 'https://i.imgur.com/qy1r0YP.png',
        configId: 'long-sleeve-shirt',
        label: 'Long Sleeve Shirt',
      },
      {
        value: 'https://i.imgur.com/jXSFyPx.png',
        configId: 'short-sleeve-shirt',
        label: 'Short Sleeve Shirt',
      },
      {
        value: 'https://i.imgur.com/dU0DmML.png',
        configId: 'suspenders',
        label: 'Suspenders',
      },
      {
        value: 'https://i.imgur.com/CiDrKgE.png',
        configId: 'overalls',
        label: 'Overalls',
      },
      {
        value: 'https://i.imgur.com/ZY3ApSE.png',
        configId: 'shawl',
        label: 'Shawl/Scarf',
      },
      {
        value: 'https://i.imgur.com/05OZJeu.png',
        configId: 'shoulder-tassels',
        label: 'Shoulder Tassels',
      },
      {
        value: 'https://i.imgur.com/P93mMC2.png',
        configId: 'coat-buttons',
        label: 'Coat Buttons',
      },
      {
        value: 'https://i.imgur.com/dLHCy1i.png',
        configId: 'bowtie',
        label: 'Bowtie',
      },
      {
        value: 'https://i.imgur.com/8Z97HhE.png',
        configId: 'vest-plaid',
        label: 'Clothes (Plaid Vest)',
      },
      {
        value: 'https://i.imgur.com/Cm4rxcX.png',
        configId: 'shirt-plaid',
        label: 'Plaid Shirt',
      },
      {
        value: 'https://i.imgur.com/0KWEB8L.png',
        configId: 'vest',
        label: 'Vest',
      },
      {
        value: 'https://i.imgur.com/4NwpX03.png',
        configId: 'coat',
        label: 'Coat',
      },
      {
        value: 'https://i.imgur.com/u7ikj2p.png',
        configId: 'coat-plaid',
        label: 'Coat (Plaid)',
      },
      {
        value: 'https://i.imgur.com/yGxdaZ1.png',
        configId: 'backpack-strap',
        label: 'Backpack Strap',
      },
      {
        value: 'https://i.imgur.com/jcFdz5j.png',
        configId: 'chest-strap1',
        label: 'Chest Strap)',
      },
      {
        value: 'https://i.imgur.com/i2Tgz6g.png',
        configId: 'chest-strap2',
        label: 'Chest Strap 2)',
      },
      {
        value: 'https://i.imgur.com/v0orNuE.png',
        configId: 'chest-medal',
        label: 'Chest Medal',
      },
      {
        value: 'https://i.imgur.com/WikSg2h.png',
        configId: 'collar-v',
        label: 'V Collar',
      },
      {
        value: 'https://i.imgur.com/ZEphNBm.png',
        configId: 'black-overcoat',
        label: 'Black Overcoat',
      },
      {
        value: 'https://i.imgur.com/4OHd5Jt.png',
        configId: 'bikini',
        label: 'Bikini',
      },
      {
        value: 'https://i.imgur.com/KWShGHp.png',
        configId: 'blouse',
        label: 'Blouse',
      },
      {
        value: 'https://i.imgur.com/NDRZ2NN.png',
        configId: 'sleeveless-shirt',
        label: 'Sleeveless Shirt',
      },
      {
        value: 'https://i.imgur.com/IxMwW64.png',
        configId: 'medium-armor',
        label: 'Medium Armor',
      },
      {
        value: 'https://i.imgur.com/LQAg1Yn.png',
        configId: 'heavy-armor',
        label: 'Clothes (Heavy Armor)',
      },
      {
        value: 'https://i.imgur.com/0h9V7uV.png',
        configId: 'tie',
        label: 'Clothes (Tie)',
      },
      {
        value: 'https://i.imgur.com/fXqGw2Q.png',
        configId: 'undertexture-vneck',
        label: 'Undertexture (Vneck)',
      },
      {
        value: 'https://i.imgur.com/nwufrnw.png',
        configId: 'undertexture-plain',
        label: 'Undertexture (Plain)',
      },
    ],
  },
  {
    option: { value: 'hairOptions', label: '💇' },
    textures: [
      {
        value: 'https://i.imgur.com/xbtbthu.png',
        configId: 'hair-afro',
        label: 'Hair (Afro)',
      },
      {
        value: 'https://i.imgur.com/S5LckvD.png',
        configId: 'hair-spiked',
        label: 'Hair (Spiked)',
      },
      {
        value: 'https://i.imgur.com/iNSm6oU.png',
        configId: 'hair-messy',
        label: 'Hair (Messy)',
      },
      {
        value: 'https://i.imgur.com/cHnDvbu.png',
        configId: 'hair-bangs-long',
        label: 'Hair (Long Bangs)',
      },
      {
        value: 'https://i.imgur.com/PUqtEX4.png',
        configId: 'hair-bangs-short',
        label: 'Hair (Short Bangs)',
      },
      {
        value: 'https://i.imgur.com/rop8Hr3.png',
        configId: 'hair-eye-covered',
        label: 'Hair (Eye Covered)',
      },
      {
        value: 'https://i.imgur.com/rV2k4TS.png',
        configId: 'hair-split-short',
        label: 'Hair (Split Short)',
      },
      {
        value: 'https://i.imgur.com/CBdk8Hw.png',
        configId: 'hair-split-long',
        label: 'Hair (Split Long)',
      },
    ],
  },
  {
    option: { value: 'eyeOptions', label: '👀️' },
    textures: [
      {
        value: 'https://i.imgur.com/Jwj03Bm.png',
        configId: 'eyes-plain',
        label: 'Plain',
      },
      {
        value: 'https://i.imgur.com/rDsh3JA.png',
        configId: 'eyes-lashes',
        label: 'Medium Lashes',
      },
      {
        value: 'https://i.imgur.com/grilVRt.png',
        configId: 'eyes-lashes-long',
        label: 'Long Lashes',
      },
      {
        value: 'https://i.imgur.com/PG024CS.png',
        configId: 'eyes-angry',
        label: 'Angry',
      },

      {
        value: 'https://i.imgur.com/kX3utmb.png',
        configId: 'pupil-dots',
        label: 'Dot Pupils',
      },
      {
        value: 'https://i.imgur.com/VYe2aaS.png',
        configId: 'pupil-normal',
        label: 'Pupils',
      },
      {
        value: 'https://i.imgur.com/9fwQrjb.png',
        configId: 'pupil-dark',
        label: 'Dark Pupils',
      },

      {
        value: 'https://i.imgur.com/wgQJ84n.png',
        configId: 'eyes-closed',
        label: 'Closed',
      },
      {
        value: 'https://i.imgur.com/4Txvdm9.png',
        configId: 'eyes-sus',
        label: 'Sus',
      },
      {
        value: 'https://i.imgur.com/3O89OiF.png',
        configId: 'eyes-happy',
        label: 'Happy',
      },
      {
        value: 'https://i.imgur.com/f06HkXj.png',
        configId: 'eyes-surprised',
        label: 'Surprised',
      },

      {
        value: 'https://i.imgur.com/vgUImcf.png',
        configId: 'eyes-single-normal',
        label: 'Single Plain',
      },
      {
        value: 'https://i.imgur.com/yFLTX78.png',
        configId: 'eyes-single-dark',
        label: 'Single Dark',
      },

      {
        value: 'https://i.imgur.com/PFywPks.png',
        configId: 'eyebrow-high',
        label: 'Normal Eyebrows',
      },
      {
        value: 'https://i.imgur.com/hxoHQMv.png',
        configId: 'eyebrow-angry',
        label: 'Angry Eyebrows',
      },
      {
        value: 'https://i.imgur.com/Bmpz81S.png',
        configId: 'eyebrow-raised',
        label: 'Raised Eyebrow',
      },
      {
        value: 'https://i.imgur.com/a29TSPR.png',
        configId: 'eyebrow-low',
        label: 'Low Eyebrows',
      },
      {
        value: 'https://i.imgur.com/xU6LfIE.png',
        configId: 'eyebrow-concern',
        label: 'Concerned Eyebrows',
      },
    ],
  },
  {
    option: { value: 'earOptions', label: '👂' },
    textures: [
      {
        value: 'https://i.imgur.com/ee0BJTS.png',
        configId: 'ears-human',
        label: 'Normal',
      },
      {
        value: 'https://i.imgur.com/K16yMTk.png',
        configId: 'ears-pointed',
        label: 'Pointed',
      },
      {
        value: 'https://i.imgur.com/QtZFfvU.png',
        configId: 'ears-bunny',
        label: 'Bunny',
      },
      {
        value: 'https://i.imgur.com/d8e4y87.png',
        configId: 'ears-cat',
        label: 'Cat',
      },
    ],
  },
  {
    option: { value: 'noseOptions', label: '👃' },
    textures: [
      {
        value: 'https://i.imgur.com/j1oOrZt.png',
        configId: 'nose-small',
        label: 'Normal',
      },
      //{value: 'https://i.imgur.com/W79LA7v.png', configId: "nose-medium", label: 'Nose (Medium)'},
      {
        value: 'https://i.imgur.com/7yOwMKy.png',
        configId: 'nose-large',
        label: 'Large',
      },
      {
        value: 'https://i.imgur.com/bAgIfEi.png',
        configId: 'nose-long',
        label: 'Long',
      },
      {
        value: 'https://i.imgur.com/O2OH5G3.png',
        configId: 'nose-round',
        label: 'Round',
      },
      {
        value: 'https://i.imgur.com/Ud2ze9I.png',
        configId: 'nose-villager',
        label: 'Villager',
      },
      {
        value: 'https://i.imgur.com/MVGkiJh.png',
        configId: 'nose-pig',
        label: 'Pig',
      },
      {
        value: 'https://i.imgur.com/MO1v95o.png',
        configId: 'nose-dog',
        label: 'Dog',
      },
    ],
  },
  {
    option: { value: 'mouthOptions', label: '👄' },
    textures: [
      {
        value: 'https://i.imgur.com/g3IsVMy.png',
        configId: 'mouth-normal',
        label: 'Neutral',
      },
      {
        value: 'https://i.imgur.com/YLkJ4GO.png',
        configId: 'mouth-big-smile',
        label: 'Big Smile',
      },
      {
        value: 'https://i.imgur.com/wqRnWlR.png',
        configId: 'mouth-smug',
        label: 'Smug',
      },
      {
        value: 'https://i.imgur.com/0ntzVFA.png',
        configId: 'mouth-blep',
        label: 'Blep',
      },
      {
        value: 'https://i.imgur.com/26gXB8O.png',
        configId: 'mouth-nervous',
        label: 'Nervous',
      },
      {
        value: 'https://i.imgur.com/hMvqysT.png',
        configId: 'mouth-shocked',
        label: 'Shocked',
      },
      {
        value: 'https://i.imgur.com/r1DUD2u.png',
        configId: 'mouth-orc',
        label: 'Orc',
      },
      {
        value: 'https://i.imgur.com/Yln1x3z.png',
        configId: 'mouth-orc2',
        label: 'Ogre',
      },
      {
        value: 'https://i.imgur.com/Li8VI1x.png',
        configId: 'mouth-orc3',
        label: 'Ogre 2',
      },
      {
        value: 'https://i.imgur.com/D3N3dRo.png',
        configId: 'mouth-fang-frown',
        label: 'Fanged Frown',
      },
      {
        value: 'https://i.imgur.com/ZivNfrG.png',
        configId: 'mouth-fang-smile',
        label: 'Fanged Smile',
      },
      {
        value: 'https://i.imgur.com/KU6jB3r.png',
        configId: 'mouth-fang',
        label: 'Fangs',
      },
      {
        value: 'https://i.imgur.com/c4NRmWf.png',
        configId: 'mouth-smile',
        label: 'Smile',
      },
      {
        value: 'https://i.imgur.com/Io1qy1b.png',
        configId: 'mouth-frown',
        label: 'Frown',
      },
      {
        value: 'https://i.imgur.com/Sqwb1Rg.png',
        configId: 'mouth-cheek',
        label: 'Cheek',
      },
    ],
  },
  {
    option: { value: 'extraHair', label: '🧔️' },
    textures: [
      {
        value: 'https://i.imgur.com/1ABS4IT.png',
        configId: 'long-hair',
        label: 'Hair Extension',
      },
      {
        value: 'https://i.imgur.com/kt3czqI.png',
        configId: 'long-braids',
        label: 'Hair Extension (Braids)',
      },
      {
        value: 'https://i.imgur.com/CQkLJNl.png',
        configId: 'shoulder-hair',
        label: 'Hair Extension (Shoulder)',
      },
      {
        value: 'https://i.imgur.com/wsPhRFB.png',
        configId: 'pony-tail',
        label: 'Ponytail',
      },
      {
        value: 'https://i.imgur.com/QmrWll5.png',
        configId: 'moustache',
        label: 'Moustache',
      },
      {
        value: 'https://i.imgur.com/RhqjZjP.png',
        configId: 'handlebar',
        label: 'Handlebar',
      },
      {
        value: 'https://i.imgur.com/pZUyKdm.png',
        configId: 'beard-full',
        label: 'Beard',
      },
      {
        value: 'https://i.imgur.com/FvqW9Kt.png',
        configId: 'beard-goat',
        label: 'Goatee',
      },
      {
        value: 'https://i.imgur.com/ehPD842.png',
        configId: 'long-beard',
        label: 'Long Beard',
      },
    ],
  },
  {
    option: { value: 'faceOptions', label: '😀' },
    textures: [
      {
        value: 'https://i.imgur.com/fPgRuQi.png',
        configId: 'blush',
        label: 'Blush',
      },
      {
        value: 'https://i.imgur.com/4pQbo7u.png',
        configId: 'single-tear',
        label: 'Crying (Single)',
      },
      {
        value: 'https://i.imgur.com/Qy2o2qs.png',
        configId: 'crying',
        label: 'Crying (Normal)',
      },
      {
        value: 'https://i.imgur.com/Dnh8e8S.png',
        configId: 'luffy-scar',
        label: 'Scar (Luffy)',
      },
      {
        value: 'https://i.imgur.com/Vy1unSi.png',
        configId: 'head-wound',
        label: 'Scar (Head)',
      },
      {
        value: 'https://i.imgur.com/Uja2a0h.png',
        configId: 'face-scratch',
        label: 'Scar (face)',
      },
      {
        value: 'https://i.imgur.com/G4B7N20.png',
        configId: 'right-eye-scar',
        label: 'Eye Scar (Right)',
      },
      {
        value: 'https://i.imgur.com/WCBEuD1.png',
        configId: 'left-eye-scar',
        label: 'Eye Scar (Left)',
      },
      {
        value: 'https://i.imgur.com/XUKmrYw.png',
        configId: 'freckles',
        label: 'Freckles 1',
      },
      {
        value: 'https://i.imgur.com/4wLTYUi.png',
        configId: 'freckles2',
        label: 'Freckles 2',
      },
      {
        value: 'https://i.imgur.com/AizM687.png',
        configId: 'face-dirty',
        label: 'Dirty Face',
      },
      {
        value: 'https://i.imgur.com/yHwkwJO.png',
        configId: 'face-scar-cross1',
        label: 'Cross Scar 1',
      },
      {
        value: 'https://i.imgur.com/uLOzeQN.png',
        configId: 'face-scar-cross2',
        label: 'Cross Scar 2',
      },
    ],
  },
  {
    option: { value: 'headwearOptions', label: '🎩' },
    textures: [
      {
        value: 'https://i.imgur.com/7O89fjJ.png',
        configId: 'goggles',
        label: 'Goggles',
      },
      {
        value: 'https://i.imgur.com/d7MxUyA.png',
        configId: 'tricorne',
        label: 'Tricorne',
      },
      {
        value: 'https://i.imgur.com/Ad7K2aS.png',
        configId: 'medium-hat',
        label: 'Medium Hat',
      },
      {
        value: 'https://i.imgur.com/vtJaQa0.png',
        configId: 'large-hat',
        label: 'Large Hat',
      },
      {
        value: 'https://i.imgur.com/ZMzNJ0m.png',
        configId: 'naval-cap',
        label: 'Naval Cap',
      },
      {
        value: 'https://i.imgur.com/z76gx8p.png',
        configId: 'straw-hat',
        label: 'Straw Hat',
      },
      {
        value: 'https://i.imgur.com/Muskoou.png',
        configId: 'frog-hat',
        label: 'Frog Hat',
      },
      {
        value: 'https://i.imgur.com/WCzwszD.png',
        configId: 'templar-helm',
        label: 'Templar Helmet',
      },
      {
        value: 'https://i.imgur.com/AMFjING.png',
        configId: 'templar-helm-trim',
        label: 'Templar Trim',
      },
      {
        value: 'https://i.imgur.com/NC9Aquy.png',
        configId: 'heavy-helmet',
        label: 'Medium Helmet',
      },
      {
        value: 'https://i.imgur.com/yxB2aCU.png',
        configId: 'knight-helm-open',
        label: 'Open Helmet',
      },
      {
        value: 'https://i.imgur.com/NG5S7Hy.png',
        configId: 'knight-helm-closed',
        label: 'Closed Helmet',
      },
      {
        value: 'https://i.imgur.com/KQFbjT9.png',
        configId: 'shadow',
        label: 'Veiled Face',
      },
      {
        value: 'https://i.imgur.com/2UEJWcO.png',
        configId: 'mouth-toast',
        label: 'Late For School',
      },
      {
        value: 'https://i.imgur.com/ZdfY0BK.png',
        configId: 'headband',
        label: 'Headband',
      },
      {
        value: 'https://i.imgur.com/QV2IACD.png',
        configId: 'hood',
        label: 'Hood',
      },
      {
        value: 'https://i.imgur.com/1ZiXxCm.png',
        configId: 'hood-trim',
        label: 'Hood Trim',
      },
      {
        value: 'https://i.imgur.com/cJQ0AVQ.png',
        configId: 'hair-flower',
        label: 'Hair Flower',
      },
      {
        value: 'https://i.imgur.com/HzZMUUO.png',
        configId: 'flower-crown-warm',
        label: 'Flower Crown (Warm)',
      },
      {
        value: 'https://i.imgur.com/cQxLRgG.png',
        configId: 'flower-crown-cool',
        label: 'Flower Crown (Cool)',
      },
      {
        value: 'https://i.imgur.com/1RTXrah.png',
        configId: 'leaf-crown',
        label: 'Leaf Crown',
      },
      {
        value: 'https://i.imgur.com/YDcjqdO.png',
        configId: 'hair-bow',
        label: 'Hair Bow',
      },
      {
        value: 'https://i.imgur.com/t0WYguh.png',
        configId: 'monocle',
        label: 'Monocle',
      },
      {
        value: 'https://i.imgur.com/zAjl0ek.png',
        configId: 'eyepatch-left',
        label: 'Eyepatch L',
      },
      {
        value: 'https://i.imgur.com/VPJDqfs.png',
        configId: 'eyepatch-right',
        label: 'Eyepatch R',
      },
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
      value: 'https://i.imgur.com/QPpHgJc.png',
      configId: 'plains',
      label: 'Plains',
    },
  },
  {
    id: uuidv4(),
    color: { rgb: { r: 255, g: 242, b: 224, a: 1 }, hex: '#FFF2E0' },
    options: { value: 'bodyTypes', label: '🧍' },
    selection: {
      value: 'https://i.imgur.com/h5EdwQL.png',
      configId: 'base-skin',
      label: 'Body (Basic)',
    },
  },
  {
    id: uuidv4(),
    color: { rgb: { r: 209, g: 37, b: 58, a: 1 }, hex: '#D1253A' },
    options: { value: 'clothesOptions', label: '👗' },
    selection: {
      value: 'https://i.imgur.com/jXSFyPx.png',
      configId: 'short-sleeve-shirt',
      label: 'Short Sleeve Shirt',
    },
  },
  {
    id: uuidv4(),
    color: { rgb: { r: 255, g: 255, b: 255, a: 1 }, hex: '#ffffff' },
    options: { value: 'eyeOptions', label: '👀️' },
    selection: {
      value: 'https://i.imgur.com/Jwj03Bm.png',
      configId: 'eyes-plain',
      label: 'Eyes (Plain)',
    },
  },
  {
    id: uuidv4(),
    color: { rgb: { r: 92, g: 171, b: 255, a: 1 }, hex: '#5CABFF' },
    options: { value: 'eyeOptions', label: '👀️' },
    selection: {
      value: 'https://i.imgur.com/VYe2aaS.png',
      configId: 'pupil-normal',
      label: 'Pupils (Normal)',
    },
  },
];
