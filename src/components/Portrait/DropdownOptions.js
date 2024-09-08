import { v4 as uuidv4 } from 'uuid';

export const textureSelections = [
  {
    option: { value: 'backgroundOptions', label: '🗺️' },
    textures: [
      { value: 'https://i.imgur.com/iYUvgVD.png', configId: 'frame', label: 'Frame'},
      { value: 'https://i.imgur.com/7hZAvqy.png', configId: 'plains', label: 'Plains'},
      { value: 'https://i.imgur.com/Zxu5bZp.png', configId: 'normal-forest', label: 'Forest'},
      { value: 'https://i.imgur.com/HkVOuhc.png', configId: 'purple-forest', label: 'Forest 2'},
      { value: 'https://i.imgur.com/M5s9c0a.png', configId: 'birch', label: 'Birch Forest'},
      { value: 'https://i.imgur.com/ulAJufC.png', configId: 'bkg-pasture', label: 'Pasture'},
      { value: 'https://i.imgur.com/4qYRXVk.png', configId: 'bkg-mill', label: 'Water Mill'},
      { value: 'https://i.imgur.com/lR5UT64.png', configId: 'windmill', label: 'Grain Mill'},
      { value: 'https://i.imgur.com/oDvu0lQ.png', configId: 'bkg-shop', label: 'Shop'},
      { value: 'https://i.imgur.com/9C6Ajq0.png', configId: 'bkg-weapons', label: 'Blacksmith'},
      { value: 'https://i.imgur.com/s4CrdDX.png', configId: 'desert', label: 'Desert'},
      { value: 'https://i.imgur.com/BwwmoY6.png', configId: 'desert-ruins', label: 'Desert Ruins'},
      { value: 'https://i.imgur.com/CumQt74.png', configId: 'desert-pyramid', label: 'Desert Pyramid'},
      { value: 'https://i.imgur.com/nBM1XQw.png', configId: 'outpost', label: 'Outpost'},
      { value: 'https://i.imgur.com/yJtYeRF.png', configId: 'outpost2', label: 'Outpost 2'},
      { value: 'https://i.imgur.com/IlEojSP.png', configId: 'near-island', label: 'Tropical Island'},
      { value: 'https://i.imgur.com/utjBMPi.png', configId: 'beach', label: 'Beach'},
      { value: 'https://i.imgur.com/xSh1cnF.png', configId: 'graveyard', label: 'Graveyard'},
      { value: 'https://i.imgur.com/ZTsX507.png', configId: 'cave1', label: 'Cave'},
      { value: 'https://i.imgur.com/7pQC5CE.png', configId: 'bkg-mushroom', label: 'Mushroom Cave'},
      { value: 'https://i.imgur.com/iokEjlb.png', configId: 'bkg-swamp', label: 'Swamp'},
      { value: 'https://i.imgur.com/udl0eGT.png', configId: 'green-swamp', label: 'Swamp 2'},
      { value: 'https://i.imgur.com/DAVJKxf.png', configId: 'bkg-swamp3', label: 'Lily Pad Swamp'},
      { value: 'https://i.imgur.com/7JBTk2E.png', configId: 'pine-path', label: 'Pine Path'},
      { value: 'https://i.imgur.com/H6aqwjj.png', configId: 'on-boat', label: 'Sailing'},
      { value: 'https://i.imgur.com/31x6iUt.png', configId: 'near-baot', label: 'Dock And Ship'},
      { value: 'https://i.imgur.com/rrb9s86.png', configId: 'thatched', label: 'Huts'},
      { value: 'https://i.imgur.com/cB7YhrG.png', configId: 'castle-wall', label: 'Castle Hall'},
      { value: 'https://i.imgur.com/eZqAcYp.png', configId: 'bamboo', label: 'Bamboo'},
      { value: 'https://i.imgur.com/EOcxqPu.png', configId: 'snow-and-trees', label: 'Snow And Trees'},
      { value: 'https://i.imgur.com/sW0EyJA.png', configId: 'lava-cave', label: 'Lava Cave'},
      { value: 'https://i.imgur.com/nef0hlR.png', configId: 'jungle-torches', label: 'Jungle Torches'},
      { value: 'https://i.imgur.com/tDNlVh2.png', configId: 'library', label: 'Library'},
      { value: 'https://i.imgur.com/0m3hz53.png', configId: 'crossroads', label: 'Crossroads'},
      { value: 'https://i.imgur.com/ksQTF6w.png', configId: 'ruins', label: 'Ruins'},
      { value: 'https://i.imgur.com/he5eACT.png', configId: 'distant-castle', label: 'Distant Castle'},
      { value: 'https://i.imgur.com/KEPR3Y3.png', configId: 'badlands', label: 'Badlands'},
      { value: 'https://i.imgur.com/cWbbnSi.png', configId: 'steve', label: 'Golfing'}
    ],
  },
  {
    option: { value: 'bodyTypes', label: '🧍' },
    textures: [
      { value: 'https://i.imgur.com/94x8Ym0.png', configId: 'base-skin', label: 'Basic' },
      { value: 'https://i.imgur.com/yuZx3GC.png', configId: 'doge-skin', label: 'Doge' },
      { value: 'https://i.imgur.com/Y0IYZYy.png', configId: 'child', label: 'Child' },
      { value: 'https://i.imgur.com/4jyJYYj.png', configId: 'fuzzy-skin', label: 'Fuzzy' },
      { value: 'https://i.imgur.com/RTQFeQm.png', configId: 'cow', label: 'Cow' },
      { value: 'https://i.imgur.com/V9phGK8.png', configId: 'rabbit1', label: 'Rabbit' },
      { value: 'https://i.imgur.com/tLYQeqW.png', configId: 'rabbit2', label: 'Rabbit 2' },
      { value: 'https://i.imgur.com/hZllhnN.png', configId: 'rabbit3', label: 'Rabbit 3' },
      { value: 'https://i.imgur.com/I8HT9yY.png', configId: 'wolf', label: 'Wolf' },
      { value: 'https://i.imgur.com/t4J6Y9E.png', configId: 'default', label: '?' },
      { value: 'https://i.imgur.com/Ol3RE6c.png', configId: 'idiot', label: 'Idiot' },
      { value: 'https://i.imgur.com/Ah1fFIA.png', configId: 'skeleton', label: 'Skellington' },
      { value: 'https://i.imgur.com/Ah1fFIA.png', configId: 'skeleton', label: 'Skellington (HAT)' },
    ],
  },
  {
    option: { value: 'clothesOptions', label: '👗' },
    textures: [
      { value: 'https://i.imgur.com/RuG6VxU.png', configId: 'long-sleeve-shirt', label: 'Long Sleeve Shirt' },
      { value: 'https://i.imgur.com/rsn9E7X.png', configId: 'short-sleeve-shirt', label: 'Short Sleeve Shirt' },
      { value: 'https://i.imgur.com/vVxJ7kV.png', configId: 'suspenders', label: 'Suspenders' },
      { value: 'https://i.imgur.com/H7FXAsg.png', configId: 'overalls', label: 'Overalls' },
      { value: 'https://i.imgur.com/pyYUxJY.png', configId: 'shawl', label: 'Shawl/Scarf' },
      { value: 'https://i.imgur.com/AidVlVx.png', configId: 'coat-buttons', label: 'Coat Buttons' },
      { value: 'https://i.imgur.com/8uO0Vnb.png', configId: 'bowtie', label: 'Bowtie' },
      { value: 'https://i.imgur.com/fWTNV8P.png', configId: 'vest-plaid', label: 'Plaid Vest' },
      { value: 'https://i.imgur.com/tBwSFFy.png', configId: 'shirt-plaid', label: 'Plaid Shirt' },
      { value: 'https://i.imgur.com/yn3Hkp2.png', configId: 'vest', label: 'Vest' },
      { value: 'https://i.imgur.com/i8i4iCX.png', configId: 'coat', label: 'Coat' },
      { value: 'https://i.imgur.com/mhhE29Z.png', configId: 'coat-plaid', label: 'Coat (Plaid)' },
      { value: 'https://i.imgur.com/84w1oDC.png', configId: 'backpack-strap', label: 'Backpack Strap' },
      { value: 'https://i.imgur.com/1HZPDSz.png', configId: 'chest-strap1', label: 'Chest Strap' },
      { value: 'https://i.imgur.com/0Snprg6.png', configId: 'chest-strap2', label: 'Chest Strap 2)' },
      { value: 'https://i.imgur.com/bA3Ghrr.png', configId: 'chest-medal', label: 'Chest Medal' },
      { value: 'https://i.imgur.com/YixuKKH.png', configId: 'collar-v', label: 'V Collar' },
      { value: 'https://i.imgur.com/WYJM0vq.png', configId: 'black-overcoat', label: 'Black Overcoat' },
      { value: 'https://i.imgur.com/fyrEkkB.png', configId: 'bikini', label: 'Bikini' },
      { value: 'https://i.imgur.com/TcDNRg4.png', configId: 'blouse', label: 'Blouse' },
      { value: 'https://i.imgur.com/NDRZ2NN.png', configId: 'sleeveless-shirt', label: 'Sleeveless Shirt' },
      { value: 'https://i.imgur.com/kg2QFL4.png', configId: 'medium-armor', label: 'Medium Armor' },
      { value: 'https://i.imgur.com/MQIbzZ1.png', configId: 'heavy-armor', label: 'Clothes (Heavy Armor)' },
      { value: 'https://i.imgur.com/Q0bpdL9.png', configId: 'tie', label: 'Tie' },
      { value: 'https://i.imgur.com/Jc9wsHx.png', configId: 'shoulder-tassels', label: 'Shoulder Tassels' },
      { value: 'https://i.imgur.com/jVl4CVi.png', configId: 'undertexture-vneck', label: 'Undertexture (Vneck)' },
      { value: 'https://i.imgur.com/hgskUkJ.png', configId: 'undertexture-plain', label: 'Undertexture (Plain)' }
    ],
  },
  {
    option: { value: 'hairOptions', label: '💇' },
    textures: [
      {  value: 'https://i.imgur.com/CXhEDzy.png',  configId: 'hair-afro',  label: 'Hair (Afro)' },
      {  value: 'https://i.imgur.com/VRM2dZf.png',  configId: 'hair-spiked',  label: 'Hair (Spiked)' },
      {  value: 'https://i.imgur.com/miiC3FP.png',  configId: 'hair-messy',  label: 'Hair (Messy)' },
      {  value: 'https://i.imgur.com/YWP9eJu.png',  configId: 'hair-bangs-long',  label: 'Hair (Long Bangs)' },
      {  value: 'https://i.imgur.com/pGydIUZ.png',  configId: 'hair-bangs-short',  label: 'Hair (Short Bangs)' },
      {  value: 'https://i.imgur.com/rop8Hr3.png',  configId: 'hair-eye-covered',  label: 'Hair (Eye Covered)' },
      {  value: 'https://i.imgur.com/UV8d32v.png',  configId: 'hair-split-short',  label: 'Hair (Split Short)' },
      {  value: 'https://i.imgur.com/CBdk8Hw.png',  configId: 'hair-split-long',  label: 'Hair (Split Long)' },
    ],
  },
  {
    option: { value: 'eyeOptions', label: '👀️' },
    textures: [
      {  value: 'https://i.imgur.com/Jwj03Bm.png',  configId: 'eyes-plain',  label: 'Plain' },
      {  value: 'https://i.imgur.com/rDsh3JA.png',  configId: 'eyes-lashes',  label: 'Medium Lashes' },
      {  value: 'https://i.imgur.com/grilVRt.png',  configId: 'eyes-lashes-long',  label: 'Long Lashes' },
      {  value: 'https://i.imgur.com/PG024CS.png',  configId: 'eyes-angry',  label: 'Angry' },

      {  value: 'https://i.imgur.com/kX3utmb.png',  configId: 'pupil-dots',  label: 'Dot Pupils' },
      {  value: 'https://i.imgur.com/VYe2aaS.png',  configId: 'pupil-normal',  label: 'Pupils' },
      {  value: 'https://i.imgur.com/9fwQrjb.png',  configId: 'pupil-dark',  label: 'Dark Pupils' },

      {  value: 'https://i.imgur.com/wgQJ84n.png',  configId: 'eyes-closed',  label: 'Closed' },
      {  value: 'https://i.imgur.com/4Txvdm9.png',  configId: 'eyes-sus',  label: 'Sus' },
      {  value: 'https://i.imgur.com/3O89OiF.png',  configId: 'eyes-happy',  label: 'Happy' },
      {  value: 'https://i.imgur.com/f06HkXj.png',  configId: 'eyes-surprised',  label: 'Surprised' },

      {  value: 'https://i.imgur.com/vgUImcf.png',  configId: 'eyes-single-normal',  label: 'Single Plain' },
      {  value: 'https://i.imgur.com/yFLTX78.png',  configId: 'eyes-single-dark',  label: 'Single Dark' },

      {  value: 'https://i.imgur.com/PFywPks.png',  configId: 'eyebrow-high',  label: 'Normal Eyebrows' },
      {  value: 'https://i.imgur.com/hxoHQMv.png',  configId: 'eyebrow-angry',  label: 'Angry Eyebrows' },
      {  value: 'https://i.imgur.com/Bmpz81S.png',  configId: 'eyebrow-raised',  label: 'Raised Eyebrow' },
      {  value: 'https://i.imgur.com/a29TSPR.png',  configId: 'eyebrow-low',  label: 'Low Eyebrows' },
      {  value: 'https://i.imgur.com/xU6LfIE.png',  configId: 'eyebrow-concern',  label: 'Concerned Eyebrows' },
    ],
  },
  {
    option: { value: 'earOptions', label: '👂' },
    textures: [
      { value: 'https://i.imgur.com/TDuwSU9.png', configId: 'ears-human', label: 'Normal' },
      { value: 'https://i.imgur.com/ssH71HN.png', configId: 'ears-pointed', label: 'Pointed' },
      { value: 'https://i.imgur.com/z0qvVSH.png', configId: 'ears-bunny', label: 'Bunny' },
      { value: 'https://i.imgur.com/mwRHRpv.png', configId: 'ears-cat', label: 'Cat' }
    ],
  },
  {
    option: { value: 'noseOptions', label: '👃' },
    textures: [
      {  value: 'https://i.imgur.com/pT3maTr.png',  configId: 'nose-small',  label: 'Normal' },
      //{value: 'https://i.imgur.com/W79LA7v.png', configId: "nose-medium", label: 'Nose (Medium)'},
      {  value: 'https://i.imgur.com/eLNO51X.png',  configId: 'nose-large',  label: 'Large' },
      {  value: 'https://i.imgur.com/lZPz4BJ.png',  configId: 'nose-long',  label: 'Long' },
      {  value: 'https://i.imgur.com/EgYQb8P.png',  configId: 'nose-round',  label: 'Round' },
      {  value: 'https://i.imgur.com/FrWZErG.png',  configId: 'nose-villager',  label: 'Villager' },
      {  value: 'https://i.imgur.com/TUYwoGt.png',  configId: 'nose-pig',  label: 'Pig' },
      {  value: 'https://i.imgur.com/MO1v95o.png',  configId: 'nose-dog',  label: 'Dog' },
    ],
  },
  {
    option: { value: 'mouthOptions', label: '👄' },
    textures: [
      {  value: 'https://i.imgur.com/g3IsVMy.png',  configId: 'mouth-normal',  label: 'Neutral' },
      {  value: 'https://i.imgur.com/YLkJ4GO.png',  configId: 'mouth-big-smile',  label: 'Big Smile' },
      {  value: 'https://i.imgur.com/wqRnWlR.png',  configId: 'mouth-smug',  label: 'Smug' },
      {  value: 'https://i.imgur.com/0ntzVFA.png',  configId: 'mouth-blep',  label: 'Blep' },
      {  value: 'https://i.imgur.com/26gXB8O.png',  configId: 'mouth-nervous',  label: 'Nervous' },
      {  value: 'https://i.imgur.com/hMvqysT.png',  configId: 'mouth-shocked',  label: 'Shocked' },
      {  value: 'https://i.imgur.com/r1DUD2u.png',  configId: 'mouth-orc',  label: 'Orc' },
      {  value: 'https://i.imgur.com/Yln1x3z.png',  configId: 'mouth-orc2',  label: 'Ogre' },
      {  value: 'https://i.imgur.com/Li8VI1x.png',  configId: 'mouth-orc3',  label: 'Ogre 2' },
      {  value: 'https://i.imgur.com/D3N3dRo.png',  configId: 'mouth-fang-frown',  label: 'Fanged Frown' },
      {  value: 'https://i.imgur.com/ZivNfrG.png',  configId: 'mouth-fang-smile',  label: 'Fanged Smile' },
      {  value: 'https://i.imgur.com/KU6jB3r.png',  configId: 'mouth-fang',  label: 'Fangs' },
      {  value: 'https://i.imgur.com/c4NRmWf.png',  configId: 'mouth-smile',  label: 'Smile' },
      {  value: 'https://i.imgur.com/Io1qy1b.png',  configId: 'mouth-frown',  label: 'Frown' },
      {  value: 'https://i.imgur.com/Sqwb1Rg.png',  configId: 'mouth-cheek',  label: 'Cheek' },
    ],
  },
  {
    option: { value: 'extraHair', label: '🧔️' },
    textures: [
      {  value: 'https://i.imgur.com/26eFCQM.png',  configId: 'long-hair',  label: 'Hair Extension' },
      {  value: 'https://i.imgur.com/r36t8wG.png',  configId: 'long-braids',  label: 'Hair Extension (Braids)' },
      {  value: 'https://i.imgur.com/4pWGwzO.png',  configId: 'shoulder-hair',  label: 'Hair Extension (Shoulder)' },
      {  value: 'https://i.imgur.com/S5ozaM0.png',  configId: 'pony-tail',  label: 'Ponytail' },
      {  value: 'https://i.imgur.com/HtJXpuM.png',  configId: 'moustache',  label: 'Moustache' },
      {  value: 'https://i.imgur.com/uTkfRr6.png',  configId: 'handlebar',  label: 'Handlebar' },
      {  value: 'https://i.imgur.com/L2T1bVV.png',  configId: 'beard-full',  label: 'Beard' },
      {  value: 'https://i.imgur.com/tSbL92d.png',  configId: 'beard-goat',  label: 'Goatee' },
      {  value: 'https://i.imgur.com/ikpTVtD.png',  configId: 'long-beard',  label: 'Long Beard' },
    ],
  },
  {
    option: { value: 'faceOptions', label: '😀' },
    textures: [
      {  value: 'https://i.imgur.com/fPgRuQi.png',  configId: 'blush',  label: 'Blush' },
      {  value: 'https://i.imgur.com/4pQbo7u.png',  configId: 'single-tear',  label: 'Crying (Single)' },
      {  value: 'https://i.imgur.com/Qy2o2qs.png',  configId: 'crying',  label: 'Crying (Normal)' },
      {  value: 'https://i.imgur.com/Dnh8e8S.png',  configId: 'luffy-scar',  label: 'Scar (Luffy)' },
      {  value: 'https://i.imgur.com/Vy1unSi.png',  configId: 'head-wound',  label: 'Scar (Head)' },
      {  value: 'https://i.imgur.com/Uja2a0h.png',  configId: 'face-scratch',  label: 'Scar (face)' },
      {  value: 'https://i.imgur.com/G4B7N20.png',  configId: 'right-eye-scar',  label: 'Eye Scar (Right)' },
      {  value: 'https://i.imgur.com/WCBEuD1.png',  configId: 'left-eye-scar',  label: 'Eye Scar (Left)' },
      {  value: 'https://i.imgur.com/XUKmrYw.png',  configId: 'freckles',  label: 'Freckles 1' },
      {  value: 'https://i.imgur.com/4wLTYUi.png',  configId: 'freckles2',  label: 'Freckles 2' },
      {  value: 'https://i.imgur.com/AizM687.png',  configId: 'face-dirty',  label: 'Dirty Face' },
      {  value: 'https://i.imgur.com/yHwkwJO.png',  configId: 'face-scar-cross1',  label: 'Cross Scar 1' },
      {  value: 'https://i.imgur.com/uLOzeQN.png',  configId: 'face-scar-cross2',  label: 'Cross Scar 2' },
    ],
  },
  {
    option: { value: 'headwearOptions', label: '🎩' },
    textures: [
      { value: 'https://i.imgur.com/oL7EMMF.png', configId: 'goggles', label: 'Goggles' },
      { value: 'https://i.imgur.com/spDRcGn.png', configId: 'hair-bow', label: 'Hair Bow' },
      { value: 'https://i.imgur.com/FjuDMZG.png', configId: 'hair-flower', label: 'Hair Flower' },
      { value: 'https://i.imgur.com/1MbKJX5.png', configId: 'straw-hat', label: 'Straw Hat' },
      { value: 'https://i.imgur.com/obNuedH.png', configId: 'naval-cap', label: 'Naval Cap' },
      { value: 'https://i.imgur.com/IflE02M.png', configId: 'medium-hat', label: 'Small Top Hat' },
      { value: 'https://i.imgur.com/UqUkXti.png', configId: 'large-hat', label: 'Top Hat' },
      { value: 'https://i.imgur.com/KXvkFnN.png', configId: 'tricorne', label: 'Tricorne' },
      { value: 'https://i.imgur.com/HrykUer.png', configId: 'flower-crown-warm', label: 'Flower Crown (Warm)' },
      { value: 'https://i.imgur.com/boRkC0B.png', configId: 'flower-crown-cool', label: 'Flower Crown (Cool)' },
      { value: 'https://i.imgur.com/GnAKPzi.png', configId: 'knight-helm-open', label: 'Knight Helm (Open)' },
      { value: 'https://i.imgur.com/Oa5X19P.png', configId: 'knight-helm-closed', label: 'Knight Helm (Closed)' },
      { value: 'https://i.imgur.com/3YI2rNA.png', configId: 'headband', label: 'Headband' },
      { value: 'https://i.imgur.com/nUN2FHP.png', configId: 'hood', label: 'Hood' },
      { value: 'https://i.imgur.com/pHZlXqg.png', configId: 'hood-trim', label: 'Hood Trim' },
      { value: 'https://i.imgur.com/xPr3avh.png', configId: 'monocle', label: 'Monocle' },
      { value: 'https://i.imgur.com/uH2wt06.png', configId: 'plague-mask', label: 'Plague Mask' },
      { value: 'https://i.imgur.com/F7MnHCI.png', configId: 'frog-hat', label: 'Frog Hat' },
      { value: 'https://i.imgur.com/rYZLVWi.png', configId: 'heavy-helmet', label: 'Heavy Helmet' },
      { value: 'https://i.imgur.com/4zQ9xqq.png', configId: 'templar-helm', label: 'Templar Helmet' },
      { value: 'https://i.imgur.com/Z2MuvMa.png', configId: 'templar-helm-trim', label: 'Templar Helmet (Trim)' },
      { value: 'https://i.imgur.com/jtqfFh2.png', configId: 'eyepatch-left', label: 'Eyepatch L' },
      { value: 'https://i.imgur.com/dnoyoQ7.png', configId: 'eyepatch-right', label: 'Eyepatch R' },
      { value: 'https://i.imgur.com/ewkomZ9.png', configId: 'mouth-toast', label: 'Late For School' },
      { value: 'https://i.imgur.com/NXqUTyv.png', configId: 'shadow', label: 'Veiled Face' }
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
