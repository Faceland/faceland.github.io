import gems from './data/gems.json';
import tomes from './data/tomes.json';
import uniques from './data/uniques.json';
import scrolls from './data/scrolls.json';

export const getCardItems = () => {
  const newItems = [];
  for (const [key, value] of Object.entries(gems)) {
    const item = value;
    item.type = 'gem';
    item.background = '#10c810';
    item.gradient = `bg-gradient-to-bl from-gordons-green to-gordons-green-end`;
    //item.imageId = 'socketGemImg'
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(tomes)) {
    const item = value;
    item.type = 'tome';
    item.background = '#2869f4';
    item.gradient = `bg-gradient-to-bl from-murder-brown to-murder-brown-end`;
    //item.imageId = 'bookImg'
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(uniques)) {
    const item = value;
    item.type = 'unique';
    item.background = '#d99712';
    item.gradient = `bg-gradient-to-bl from-kilamanjaro to-kilamanjaro-end`;
    //item.imageId = 'swordImg'
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(scrolls)) {
    const item = value;
    item.type = 'scroll';
    item.background = '#34981a';
    item.gradient = `bg-gradient-to-bl from-black-forest to-black-forest-end`;
    //item.imageId = 'scrollImg'
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
