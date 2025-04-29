import React, { useState, useEffect, useContext } from 'react';
import Select from 'react-select';
import './Shuffle.scss';
import '../Tooltip/tooltip.scss';
import '../../animations.scss';
import { DebounceInput } from 'react-debounce-input';
import { Context } from '../../Store';
import { BetterMcText } from './mctext/BetterMcText';
import { YeHaplessBuffoon } from './YeHaplessBuffoon';
import { rarityOptions, typeOptions } from './constants';
import { getCardItems } from './utils';

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

  useEffect(() => {
    if (cardItems.length === 0) {
      setCardItems(getCardItems());
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
      item.passives?.join(' ').toLowerCase().includes(lowered) ||
      item.flavorText?.join(' ').toLowerCase().includes(lowered) ||
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

  const stats = (item) => {
    return (
      <div>
        {item?.description?.map((line, index2) => (
          <div key={`lore${index2}`}>
            <BetterMcText line={line} className="lore" />
          </div>
        ))}
      </div>
    );
  };

  const flavorText = (item) => {
    return (
        <div>
          <div key={`lore-1`}>
            <BetterMcText line="" className="lore" />
          </div>
          {item?.flavorText?.map((line, index2) => (
              <div key={`lore${index2}`}>
                <BetterMcText line={line} className="lore" />
              </div>
          ))}
        </div>
    );
  };

  const passives = (item) => {
    return (
        <div>
          <div key={`lore-1`}>
            <BetterMcText line="" className="lore"/>
          </div>
          {item?.passives?.map((line, index2) => (
              <div key={`lore${index2}`}>
                <BetterMcText line={line} className="lore"/>
              </div>
          ))}
        </div>
    );
  };

  const gemSlots = (item) => {
    return (
        <div className="flex self-center">
        {item?.gemSlots > 0 && (
          <div className="flex">
            {Array.from({ length: item?.gemSlots }, () => (
              <div className="socket m-3"></div>
            ))}
          </div>
        )}
        {item?.extendSlots > 0 && (
          <div className="flex">
            {Array.from({ length: item?.extendSlots }, () => (
              <div className="socketExtender m-3"></div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const dropLevel = (item) => {
    if (item.dropBase === 0) {
      return <div className="flex h-full flex-col justify-center leading-tight drops-specific-format">
        Drops From Specific Enemies
      </div>
    }
    if (item.dropBase < 0 || item.dropRange >= 100 || item.dropRange <= 0) {
      return <div className="flex h-full flex-col justify-center leading-tight drops-global-format">
        Global Drop
      </div>
    }
    const minimum = Math.max(1, item.dropBase - item.dropRange);
    const maximum = Math.min(100, item.dropBase + item.dropRange);
    const range = "Drop Range: Lv" + minimum + " to Lv" + maximum;
    return <div className="flex h-full flex-col justify-center leading-tight drops-range-format">
      {range}
    </div>
  };

  return (
    <div className="relative min-h-[76vh]">
      {state.mobile ? mobileFilterSection : desktopFilterSection}
      <div className="flex place-content-center" style={{ flexFlow: 'wrap' }}>
        {filteredItems?.length === 0 ? (
          <div className="flex place-content-center">
            <YeHaplessBuffoon />
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <div
              className="shuffleCard squishAnimation"
              id={`card-${index}`}
              key={`Card-${item.name}-${item?.type}-${index}`}
              style={{ borderColor: `${item?.background}` }}
            >
              <div className={`flex h-full flex-col items-center ${item?.gradient} m0 p-0`}>
                <div
                    className={`flex h-full w-full flex-col items-start bg-black/30 p-2 font-semibold transition duration-200 ease-in-out hover:bg-transparent`}>
                  <div
                      className={`squishImg speed-2 absolute ${item?.imageId}`}
                      style={{width: 32, height: 32, right: '4px', top: '4px'}}
                  />
                  <div className="flex w-full flex-row place-content-between">
                    <BetterMcText
                        line={item?.name}
                        className="subtitle ml-0.5"
                    />
                  </div>
                  <div className="mb-2 text-left">
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
                            className="m-0.5 inline-flex rounded-sm bg-chambray px-1 py-0.5 text-[10px] font-semibold uppercase text-white hover:bg-san-marino"
                            key={`tag${index2}`}
                            onClick={() => forceTag(tag)}
                        >
                          {tag}
                        </button>
                    ))}
                  </div>
                  <div className="h-full w-full rounded-md bg-black bg-opacity-50 px-1 py-2">
                    <div className="flex h-full flex-col justify-center leading-tight">
                      {stats(item)}
                      {item?.enchantable && <div className="enchantable"></div>}
                      {item?.passives?.length > 0 && passives(item)}
                      {(item?.gemSlots > 0 || item?.extendSlots > 0) && gemSlots(item)}
                      {item?.flavorText?.length > 0 && flavorText(item)}
                    </div>
                  </div>
                  <div className="w-full rounded-md bg-black bg-opacity-50 px-1 py-1 mt-1">
                    {dropLevel(item)}
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
