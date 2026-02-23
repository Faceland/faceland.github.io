export const typeOptions = [
  { value: 'any', label: 'Any' },
  { value: 'gem', label: 'Gem' },
  { value: 'tome', label: 'Tome' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'unique', label: 'Unique' },
  { value: 'fish', label: 'Fish' },
  { value: 'material', label: 'Material' },
];

export const rarityOptions = [
  { value: 'any', label: 'Any' },
  { value: 'Common', label: 'Common' },
  { value: 'Uncommon', label: 'Uncommon' },
  { value: 'Rare', label: 'Rare' },
  { value: 'Epic', label: 'Epic' },
];

export const sortOptions = [
  { value: 'name-asc', label: 'By Name A-Z' },
  { value: 'name-desc', label: 'By Name Z-A' },
  { value: 'level-desc', label: 'By Highest Level' },
  { value: 'level-asc', label: 'By Lowest Level' },
  { value: 'rarity-desc', label: 'By Most Rare' },
  { value: 'rarity-asc', label: 'By Most Common' },
];

export const rarityRank = {
  'Common': 0,
  'Uncommon': 1,
  'Rare': 2,
  'Epic': 3,
};