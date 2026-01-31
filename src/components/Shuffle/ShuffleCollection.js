import React, { useState, useEffect, useContext, useRef, useLayoutEffect } from 'react';
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

const ClearIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
  </svg>
);

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 34,
    background: 'linear-gradient(180deg, #f0f0f0 0%, #e8e8e8 50%, #e0e0e0 100%)',
    border: '1px solid #505050',
    borderBottomWidth: 3,
    borderRadius: 3,
    boxShadow: state.isFocused
      ? 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.1), inset 1px 0 0 rgba(255,255,255,0.5), inset -1px 0 0 rgba(255,255,255,0.5), 0 0 0 2px rgba(255,208,80,0.6), 0 3px 6px rgba(0,0,0,0.25)'
      : 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.1), inset 1px 0 0 rgba(255,255,255,0.5), inset -1px 0 0 rgba(255,255,255,0.5), 0 3px 6px rgba(0,0,0,0.25)',
    '&:hover': { borderColor: '#505050' },
  }),
  valueContainer: (base) => ({ ...base, paddingTop: 0, paddingBottom: 0 }),
  indicatorsContainer: (base) => ({ ...base, height: 34 }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#f0d028',
    borderRadius: 3,
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#ffffff',
    fontWeight: 600,
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#ffffff',
    ':hover': {
      backgroundColor: '#d4b020',
      color: '#ffffff',
    },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'rgba(255, 180, 30, 0.7)'
      : state.isFocused
        ? 'rgba(255, 190, 50, 0.5)'
        : 'transparent',
    color: '#2a2a2a',
    '&:active': {
      backgroundColor: 'rgba(255, 180, 30, 0.7)',
    },
  }),
};

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
  const [animationKey, setAnimationKey] = useState(0);
  const [newCardIds, setNewCardIds] = useState(new Set());
  const [selectedCardIds, setSelectedCardIds] = useState(new Set());
  const [filterWidth, setFilterWidth] = useState('100%');
  const [mobileMinWidth, setMobileMinWidth] = useState(340);
  const [isSticky, setIsSticky] = useState(false);
  const selectedCardIdsRef = useRef(new Set());
  const cardRefs = useRef({});
  const cardPositions = useRef({});
  const prevFilteredIds = useRef(new Set());
  const cardsContainerRef = useRef(null);
  const filterSectionRef = useRef(null);
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
    const container = cardsContainerRef.current;
    if (!container) return;

    const updateFilterWidth = () => {
      const containerWidth = container.offsetWidth;
      const cardWidth = 340; // 320px card + 20px margin
      const cardsPerRow = Math.floor(containerWidth / cardWidth);
      const actualWidth = cardsPerRow * cardWidth + 20; // +20px padding

      if (state.mobile) {
        setMobileMinWidth(actualWidth > 0 ? actualWidth : 340);
      } else {
        setFilterWidth(actualWidth > 0 ? `${actualWidth}px` : '100%');
      }
    };

    const resizeObserver = new ResizeObserver(updateFilterWidth);
    resizeObserver.observe(container);
    updateFilterWidth();

    return () => resizeObserver.disconnect();
  }, [filteredItems.length, state.mobile]);

  useEffect(() => {
    const handleScroll = () => {
      const threshold = 50; // navbar height
      setIsSticky(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (cardItems.length > 0) {
      applyFilters();
    }
  }, [searchText, selectedTags, selectedRarity, selectedType, cardItems]);

  const toggleCardSelection = (e, cardId) => {
    e.stopPropagation();
    const newSet = new Set(selectedCardIds);
    if (newSet.has(cardId)) {
      newSet.delete(cardId);
    } else {
      newSet.add(cardId);
    }
    setSelectedCardIds(newSet);
    selectedCardIdsRef.current = newSet;
  };

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

  const getCardId = (item) => {
    if (item.type === 'unique') {
      return `${item.strippedName}+${item.tier}+${item.dropBase}`;
    }
    return `${item.name}-${item.type}`;
  };

  const handleMouseMove = (e, el) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;

    const mouseXPercent = (x / rect.width) * 100;
    const mouseYPercent = (y / rect.height) * 100;

    const inverseX = 100 - mouseXPercent;
    const inverseY = 100 - mouseYPercent;

    el.style.setProperty('--mouse-x', `${inverseX}%`);
    el.style.setProperty('--mouse-y', `${inverseY}%`);
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = (el) => {
    el.style.setProperty('--mouse-x', '80%');
    el.style.setProperty('--mouse-y', '80%');
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  };

  useLayoutEffect(() => {
    if (animationKey === 0) return;

    filteredItems.forEach(item => {
      const id = getCardId(item);
      const el = cardRefs.current[id];
      const oldPos = cardPositions.current[id];

      if (el && oldPos && !newCardIds.has(id)) {
        const newRect = el.getBoundingClientRect();
        const deltaX = oldPos.x - newRect.left;
        const deltaY = oldPos.y - newRect.top;

        if (deltaX !== 0 || deltaY !== 0) {
          el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          el.style.transition = 'none';

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.style.transition = 'transform 0.2s ease-out';
              el.style.transform = 'translate(0, 0)';
            });
          });
        }
      }
    });
  }, [filteredItems, animationKey]);

  const saveCardPositions = () => {
    Object.keys(cardRefs.current).forEach(id => {
      const el = cardRefs.current[id];
      if (el) {
        const rect = el.getBoundingClientRect();
        cardPositions.current[id] = { x: rect.left, y: rect.top };
      }
    });
  };

  const applyFilters = () => {
    saveCardPositions();

    const currentSelectedIds = selectedCardIdsRef.current;

    let newFiltered = cardItems
      .filter(
        (item) =>
          currentSelectedIds.has(getCardId(item)) ||
          (itemMatchesFilters(item) &&
          tagsApplicable(item) &&
          itemMatchesSearch(item)),
      )
      .sort(function (a, b) {
        const aId = getCardId(a);
        const bId = getCardId(b);
        const aSelected = currentSelectedIds.has(aId);
        const bSelected = currentSelectedIds.has(bId);
        if (aSelected && !bSelected) return -1;
        if (bSelected && !aSelected) return 1;
        return a.strippedName < b.strippedName
          ? -1
          : a.strippedName > b.strippedName
            ? 1
            : 0;
      });

    const newIds = new Set(newFiltered.map(getCardId));
    const addedCards = new Set();

    newFiltered.forEach(item => {
      const id = getCardId(item);
      if (!prevFilteredIds.current.has(id)) {
        addedCards.add(id);
      }
    });

    setNewCardIds(addedCards);
    setAnimationKey(prev => prev + 1);
    setFilteredItems(newFiltered);
    prevFilteredIds.current = newIds;
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

  const stickyGradientStyle = {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100vw',
    height: '100%',
    background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0) 100%)',
    opacity: isSticky ? 1 : 0,
    transition: 'opacity 0.2s ease-out',
    pointerEvents: 'none',
    zIndex: -1,
  };

  const desktopFilterSection = (
    <div style={{ position: 'sticky', top: 50, zIndex: 100 }}>
      <div style={stickyGradientStyle} />
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: '15px',
        padding: '15px',
        width: filterWidth,
        margin: '0 auto',
        position: 'relative',
        boxSizing: 'border-box',
        textAlign: 'left'
      }}>
        <div style={{ flex: 4, minWidth: 0 }}>
          <span className="filterTitles">Filter Tags</span>
          <Select
            placeholder="Select"
            isMulti
            value={selectedTags}
            options={filterTags}
            onChange={setSelectedTags}
            styles={selectStyles}
          />
        </div>
        <div style={{ flex: 1.5, minWidth: 0 }}>
          <span className="filterTitles">Rarity</span>
          <Select
            placeholder="Select"
            value={selectedRarity}
            options={rarityOptions}
            onChange={setSelectedRarity}
            styles={selectStyles}
          />
        </div>
        <div style={{ flex: 1.5, minWidth: 0 }}>
          <span className="filterTitles">Item Type</span>
          <Select
            placeholder="Select"
            value={selectedType}
            options={typeOptions}
            onChange={setSelectedType}
            styles={selectStyles}
          />
        </div>
        <div className="searchBox" style={{ flex: 2, minWidth: 0 }}>
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
        <div style={{ flexShrink: 0 }}>
          <span className="filterTitles">Clear</span>
          <button
            className="clearButton"
            onClick={clearAllFilters}
            aria-label="Clear all filters"
            type="button"
          >
            <ClearIcon />
          </button>
        </div>
      </div>
    </div>
  );

  const mobileFilterSection = (
    <div style={{ position: 'sticky', top: 50, zIndex: 100 }}>
      <div style={stickyGradientStyle} />
      <div className="mobileFilters" style={{ width: '80%', minWidth: mobileMinWidth, margin: '0 auto', position: 'relative' }}>
      <div className="flexRow align-left" style={{ padding: '8px 15px 4px' }}>
        <div className="width100">
          <Select
            placeholder="Filter Tags"
            isMulti
            value={selectedTags}
            options={filterTags}
            onChange={setSelectedTags}
            styles={selectStyles}
          />
        </div>
      </div>
      <div className="flexRow align-left" style={{ padding: '4px 15px', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <Select
            placeholder="Rarity"
            value={selectedRarity}
            options={rarityOptions}
            onChange={setSelectedRarity}
            styles={selectStyles}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Select
            placeholder="Type"
            value={selectedType}
            options={typeOptions}
            onChange={setSelectedType}
            styles={selectStyles}
          />
        </div>
        <button
          className="clearButton"
          style={{ minWidth: '39px', height: '39px' }}
          onClick={clearAllFilters}
          aria-label="Clear all filters"
          type="button"
        >
          <ClearIcon />
        </button>
      </div>
      <div className="flexRow align-left" style={{ padding: '4px 15px 8px' }}>
        <div className="width100 searchBox">
          <DebounceInput
            placeholder="Search..."
            debounceTimeout={1000}
            value={searchText}
            forceNotifyByEnter={true}
            forceNotifyOnBlur={true}
            minLength={0}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
      </div>
    </div>
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
    if (item.dropRange === 0) {
      return <div className="flex h-full flex-col justify-center leading-tight drops-specific-format">
        Drops From Specific Enemies
      </div>
    }
    let minimum = item.dropBase - item.dropRange;
    minimum = Math.max(1, minimum);
    let maximum = item.dropBase + item.dropRange;
    maximum = Math.min(100, maximum);
    if (item.dropRange === -1 || (minimum === 1 && maximum === 100)) {
      return <div className="flex h-full flex-col justify-center leading-tight drops-global-format">
        Global Drop
      </div>
    }
    const range = "Drop Range: Lv" + minimum + " to Lv" + maximum;
    return <div className="flex h-full flex-col justify-center leading-tight drops-range-format">
      {range}
    </div>
  };

  return (
    <div className="relative min-h-[76vh]">
      {state.mobile ? mobileFilterSection : desktopFilterSection}
      <div ref={cardsContainerRef} className="flex place-content-center" style={{ flexFlow: 'wrap' }}>
        {filteredItems?.length === 0 ? (
          <div className="flex place-content-center">
            <YeHaplessBuffoon />
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const cardId = getCardId(item);
            const isNewCard = newCardIds.has(cardId);
            const isSelected = selectedCardIds.has(cardId);
            return (
            <div
              className={`shuffleCard squishAnimation ${isNewCard ? 'card-enter' : ''} ${isSelected ? 'card-selected' : ''}`}
              id={`card-${index}`}
              key={`Card-${cardId}`}
              ref={el => cardRefs.current[cardId] = el}
              style={{
                '--card-highlight': `${item?.background}`,
                animationDelay: isNewCard ? `${Math.min(index * 0.03, 0.5)}s` : '0s'
              }}
              onClick={(e) => toggleCardSelection(e, cardId)}
              onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
              onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
            >
              <span className="highlight-bottom" />
              <div className={`flex h-full flex-col items-center ${item?.gradient} m0 p-0`}>
                <div
                    className={`flex h-full w-full flex-col items-start bg-black/20 p-2 font-semibold transition duration-200 ease-in-out hover:bg-transparent`}>
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
                    <button
                        className="m-0.5 inline-flex text-[10px] font-semibold uppercase text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rarityOption = rarityOptions.find(r => r.value === item?.rarity);
                          if (rarityOption) setSelectedRarity(rarityOption);
                        }}
                    >
                      <div
                          className={`rounded-sm px-1 py-0.5 rarity-${item?.rarity}`}
                      >
                        {item?.rarity}
                      </div>
                    </button>
                    {item?.groupNames?.map((tag, index2) => (
                        <button
                            className="m-0.5 inline-flex rounded-sm bg-chambray px-1 py-0.5 text-[10px] font-semibold uppercase text-white hover:bg-san-marino"
                            key={`tag${index2}`}
                            onClick={(e) => { e.stopPropagation(); forceTag(tag); }}
                        >
                          {tag}
                        </button>
                    ))}
                  </div>
                  <div className="h-full w-full rounded-md bg-black/40 px-1 py-2">
                    <div className="flex h-full flex-col justify-center leading-tight">
                      {stats(item)}
                      {item?.enchantable && <div className="enchantable"></div>}
                      {item?.passives?.length > 0 && passives(item)}
                      {(item?.gemSlots > 0 || item?.extendSlots > 0) && gemSlots(item)}
                      {item?.flavorText?.length > 0 && flavorText(item)}
                    </div>
                  </div>
                  <div className="w-full rounded-md bg-black/40 px-1 py-1 mt-1">
                    {dropLevel(item)}
                  </div>
                </div>
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
};
