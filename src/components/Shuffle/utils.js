import gems from './data/gems.json';
import tomes from './data/tomes.json';
import uniques from './data/uniques.json';
import scrolls from './data/scrolls.json';
import fish from './data/fish.json';
import materials from './data/materials.json';

export const getCardItems = () => {
  const newItems = [];
  for (const [key, value] of Object.entries(gems)) {
    const item = value;
    item.type = 'gem';
    item.background = '#10c810';
    item.gradient = `bg-gradient-to-bl from-gordons-green to-gordons-green-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(tomes)) {
    const item = value;
    item.type = 'tome';
    item.background = '#2869f4';
    item.gradient = `bg-gradient-to-bl from-murder-brown to-murder-brown-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(uniques)) {
    const item = value;
    item.type = 'unique';
    item.background = '#d97612';
    item.gradient = `bg-gradient-to-bl from-kilamanjaro to-kilamanjaro-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(scrolls)) {
    const item = value;
    item.type = 'scroll';
    item.background = '#34981a';
    item.gradient = `bg-gradient-to-bl from-black-forest to-black-forest-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(fish)) {
    const item = value;
    item.type = 'fish';
    item.background = '#4bdffa';
    item.gradient = `bg-gradient-to-bl from-deep-sea to-deep-sea-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(materials)) {
    const item = value;
    item.type = 'material';
    item.background = '#ffc23f';
    item.gradient = `bg-gradient-to-bl from-gold-dust to-gold-dust-end`;
    newItems.push(item);
  }

  newItems.forEach((item) => {
    item.groupNames = [...new Set(item.groupNames)];
    item.groupNames = item.groupNames.map(name => {
      name = name.replace('Any ', '');
      name = name.replace(' Weapons', '');
      return name
    });
  })

  return newItems;
};
