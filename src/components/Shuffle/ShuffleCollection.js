import React, { useState, useEffect, useContext } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.cjs';
import './Shuffle.scss';
import '../Tooltip/tooltip.scss';
import gems from './gems.json';
import tomes from './tomes.json';
import uniques from './uniques.json';
import scrolls from './scrolls.json';
import McText from 'mctext-react/lib/McText';
import { DebounceInput } from 'react-debounce-input';
import { Context } from '../../Store';

export const ShuffleCollection = () => {
  const [state] = useContext(Context);

  const [cardItems, setCardItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([
    { name: 'loading', meme: 'yes' },
  ]);

  const [availableTags, setAvailableTags] = useState([]);

  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedType, setSelectedType] = useState({
    value: 'gem',
    label: 'Gem',
  });
  const [selectedRarity, setSelectedRarity] = useState();
  const [searchText, setSearchText] = useState();

  const [filterTags, setFilterTags] = useState([]);

  const bannerText = {};
  bannerText.event = 'Event Reward';
  bannerText.transmute = 'Transmutation Only';
  bannerText.discontinued = 'Discontinued';

  const typeOptions = [
    { value: 'any', label: 'Any' },
    { value: 'gem', label: 'Gem' },
    { value: 'tome', label: 'Tome' },
    { value: 'scroll', label: 'Scroll' },
    { value: 'unique', label: 'Unique' },
  ];

  const rarityOptions = [
    { value: 'any', label: 'Any' },
    { value: 'Common', label: 'Common' },
    { value: 'Uncommon', label: 'Uncommon' },
    { value: 'Rare', label: 'Rare' },
    { value: 'Epic', label: 'Epic' },
  ];

  useEffect(() => {
    if (cardItems.length === 0) {
      const newItems = [];
      for (const [key, value] of Object.entries(gems)) {
        const item = value;
        item.type = 'gem';
        item.img =
          'https://static.wikia.nocookie.net/minecraft_gamepedia/images/2/26/Emerald_JE3_BE3.png';
        item.background = '#10c810';
        item.gradient = `bg-gradient-to-bl from-black-forest from-10%`;
        newItems.push(item);
      }
      for (const [key, value] of Object.entries(tomes)) {
        const item = value;
        item.type = 'tome';
        item.img =
          'https://static.wikia.nocookie.net/minecraft_gamepedia/images/5/50/Book_JE2_BE2.png';
        item.background = '#1243d9';
        item.gradient = `bg-gradient-to-bl from-murder-brown from-10%`;
        newItems.push(item);
      }
      for (const [key, value] of Object.entries(uniques)) {
        const item = value;
        item.type = 'unique';
        item.img =
          'https://static.wikia.nocookie.net/minecraft_gamepedia/images/5/50/Book_JE2_BE2.png';
        item.background = '#d99712';
        item.gradient = `bg-gradient-to-bl from-kilamanjaro from-10%`;
        newItems.push(item);
      }
      for (const [key, value] of Object.entries(scrolls)) {
        const item = value;
        item.type = 'scroll';
        item.img =
          'https://static.wikia.nocookie.net/minecraft_gamepedia/images/f/f2/Paper_JE2_BE2.png';
        item.background = '#34981a';
        item.gradient = `bg-gradient-to-bl from-black-forest from-10%`;
        newItems.push(item);
      }

      setCardItems(newItems);
      setSelectedTags([]);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchText, selectedTags, selectedRarity, selectedType]);

  useEffect(() => {
    const set = new Set(availableTags);
    cardItems.forEach((item) => {
      item.groupNames.forEach((tag) => {
        set.add(tag);
      });
    });
    setAvailableTags(Array.from(set));

    const tags = [];
    set.forEach((tag) => {
      tags.push({ value: tag, label: tag });
    });
    setFilterTags(tags);
  }, [cardItems]);

  const applyFilters = () => {
    setFilteredItems(
      cardItems
        .filter(
          (item) =>
            itemMatchesFilters(item) &&
            tagsApplicable(item) &&
            itemMatchesSearch(item),
        )
        .sort(function (a, b) {
          return a.strippedName < b.strippedName
            ? -1
            : a.strippedName > b.strippedName
              ? 1
              : 0;
        }),
    );
  };

  const itemMatchesFilters = (item) => {
    if (
      selectedRarity &&
      selectedRarity.value !== 'any' &&
      item.rarity !== selectedRarity.value
    ) {
      return false;
    }
    if (
      selectedType &&
      selectedType.value !== 'any' &&
      item.type !== selectedType.value
    ) {
      return false;
    }
    return true;
  };

  const tagsApplicable = (item) => {
    if (selectedTags.length === 0) return true;
    for (const tag of selectedTags) {
      if (!item.groupNames.includes(tag.value)) return false;
    }
    return true;
  };

  const itemMatchesSearch = (item) => {
    if (!searchText) {
      return true;
    }
    const lowered = searchText.toLowerCase();
    return (
      item.name?.toLowerCase().includes(lowered) ||
      item.title?.toLowerCase().includes(lowered) ||
      item.description?.join(' ').toLowerCase().includes(lowered) ||
      item.groupNames?.join(' ').toLowerCase().includes(lowered)
    );
  };

  const forceTag = (newTag) => {
    let exists = false;
    selectedTags.forEach((tag) => {
      if (tag.value === newTag) {
        exists = true;
      }
    });
    if (exists) {
      return;
    }
    const newTags = Object.assign([], selectedTags);
    newTags.push({ value: newTag, label: newTag });
    setSelectedTags(newTags);
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    setSelectedType(null);
    setSelectedRarity(null);
    setSearchText('');
  };

  const desktopFilterSection = (
    <div className="flexRow align-left padding-full-15">
      <div className="width40">
        <span className="filterTitles">Filter Tags</span>
        <Select
          placeholder="Select"
          isMulti
          value={selectedTags}
          options={filterTags}
          onChange={setSelectedTags}
        />
      </div>
      <div className="width15">
        <span className="filterTitles">Rarity</span>
        <Select
          placeholder="Select"
          value={selectedRarity}
          options={rarityOptions}
          onChange={setSelectedRarity}
        />
      </div>
      <div className="width15">
        <span className="filterTitles">Item Type</span>
        <Select
          placeholder="Select"
          value={selectedType}
          options={typeOptions}
          onChange={setSelectedType}
        />
      </div>
      <div className="width20 searchBox">
        <span className="filterTitles">Search</span>
        <DebounceInput
          placeholder="Enter whatever :O"
          debounceTimeout={1000}
          value={searchText}
          forceNotifyByEnter={true}
          forceNotifyOnBlur={true}
          minLength={0}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <div className="width5">
        <span className="filterTitles">Clear</span>
        <div className="clearButton align-center" onClick={clearAllFilters}>
          X
        </div>
      </div>
    </div>
  );

  const mobileFilterSection = (
    <>
      <div className="flexRow align-left padding-full-15">
        <div className="width100">
          <span className="filterTitles">Filter Tags</span>
          <Select
            placeholder="Select"
            isMulti
            value={selectedTags}
            options={filterTags}
            onChange={setSelectedTags}
          />
        </div>
      </div>
      <div className="flexRow align-left padding-full-15">
        <div className="width45">
          <span className="filterTitles">Rarity</span>
          <Select
            placeholder="Select"
            value={selectedRarity}
            options={rarityOptions}
            onChange={setSelectedRarity}
          />
        </div>
        <div className="width45">
          <span className="filterTitles">Item Type</span>
          <Select
            placeholder="Select"
            value={selectedType}
            options={typeOptions}
            onChange={setSelectedType}
          />
        </div>
        <div className="width75 searchBox">
          <span className="filterTitles">Search</span>
          <DebounceInput
            placeholder="Enter whatever :O"
            debounceTimeout={1000}
            value={searchText}
            forceNotifyByEnter={true}
            forceNotifyOnBlur={true}
            minLength={0}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
      <div className="flexRow align-left padding-full-15">
        <div className="width100">
          <div className="clearButton align-center" onClick={clearAllFilters}>
            X
          </div>
        </div>
      </div>
    </>
  );

  const yeHaplessBuffoon = (
    <div
      className="flex w-80 flex-col items-center gap-3 rounded-md border-t-8 border-red-900 bg-gray-900 p-3 font-bold text-white"
      key="invalid-search"
    >
      <div>
        <div>⚠ IMPOTENT QUERIER DETECTED ⚠</div>
        <div>HALT! YOU'VE FOUND NO RESULTS!</div>
      </div>
      <img
        src="https://i.imgur.com/eb3dM.gif"
        alt="aaaaaaaaaa"
        className="h-28 w-28"
      />
      <p>Please refine your search and/or yourself, ye hapless buffoon</p>
    </div>
  );

  return (
    <div className="relative">
      {state.mobile ? mobileFilterSection : desktopFilterSection}
      <div>
        {filteredItems?.length === 0 ? (
          <div className="flex place-content-center">{yeHaplessBuffoon}</div>
        ) : (
          filteredItems.map((item, index) => (
            <div
              className="shuffleCard"
              id={`card-${index}`}
              key={`Card-${item.name}-${item?.type}-${index}`}
              style={{ borderColor: `${item?.background}` }}
            >
              <div
                className={`flex flex-col items-start ${item?.gradient} p-2 font-semibold`}
              >
                <img
                  src={item?.img}
                  alt="Loading..."
                  className="absolute h-9 w-9"
                  style={{ right: '4px', top: '4px' }}
                />
                <div className="flex w-full flex-row place-content-between">
                  <McText className="subtitle ml-0.5" prefix={'&'}>
                    {item?.name}
                  </McText>
                </div>
                <div className="text-left">
                  {item?.specialFlag && (
                    <div className="m-0.5 inline-flex text-[10px] font-semibold uppercase text-white">
                      <div
                        className={`rounded-sm px-1 py-0.5 special-${item?.specialFlag}`}
                      >
                        {item?.specialFlag}
                      </div>
                    </div>
                  )}
                  <div className="m-0.5 inline-flex text-[10px] font-semibold uppercase text-white">
                    <div
                      className={`rounded-sm px-1 py-0.5 rarity-${item?.rarity}`}
                    >
                      {item?.rarity}
                    </div>
                  </div>
                  {item?.groupNames?.map((tag, index2) => (
                    <button
                      className="bg-chambray hover:bg-san-marino m-0.5 inline-flex rounded-sm px-1 py-0.5 text-[10px] font-semibold uppercase text-white"
                      key={`tag${index2}`}
                      onClick={() => forceTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="w-full rounded-md bg-black bg-opacity-60 p-1 text-left">
                  <div>
                    {item?.description?.map((line, index2) => (
                      <div>
                        <McText
                          className="lore"
                          prefix={'&'}
                          key={`lore${index2}`}
                        >
                          {line}
                        </McText>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
