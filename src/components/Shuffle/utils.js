import gems from './data/gems.json';
import tomes from './data/tomes.json';
import uniques from './data/uniques.json';
import scrolls from './data/scrolls.json';
import { get } from 'lodash';
import { itemImages } from './constants';

const getImageUrl = (str) => {
  let url = get(itemImages, str);
  if (url) {
    return url;
  }
  if (str.includes('-')) {
    str = str.split('-')[0];
    url = get(itemImages, str);
    if (url) {
      return url;
    }
  }
  return 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/5/50/Book_JE2_BE2.png';
};

export const getCardItems = () => {
  const newItems = [];
  for (const [key, value] of Object.entries(gems)) {
    const item = value;
    item.type = 'gem';
    item.img = getImageUrl('GEM');
    item.background = '#10c810';
    item.gradient = `bg-gradient-to-bl from-gordons-green to-gordons-green-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(tomes)) {
    const item = value;
    item.type = 'tome';
    item.img = getImageUrl('TOME');
    item.background = '#1243d9';
    item.gradient = `bg-gradient-to-bl from-murder-brown to-murder-brown-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(uniques)) {
    const item = value;
    item.type = 'unique';
    item.img = getImageUrl('LEATHER_CHESTPLATE-9000');
    item.background = '#d99712';
    item.gradient = `bg-gradient-to-bl from-kilamanjaro to-kilamanjaro-end`;
    newItems.push(item);
  }
  for (const [key, value] of Object.entries(scrolls)) {
    const item = value;
    item.type = 'scroll';
    item.img = getImageUrl('SCROLL');
    item.background = '#34981a';
    item.gradient = `bg-gradient-to-bl from-black-forest to-black-forest-end`;
    newItems.push(item);
  }
  return newItems;
};
