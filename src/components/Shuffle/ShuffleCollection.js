import React, {useState, useEffect, useCallback, useMemo} from "react";
import {debounce} from 'lodash';
import Select from "react-select";
import "react-select/dist/react-select.cjs";
import "./Shuffle.scss"
import "../Tooltip/tooltip.scss"
import gems from "./gems.json"
import tomes from "./tomes.json"
import uniques from "./uniques.json"
import scrolls from "./scrolls.json"
import McText from "mctext-react/lib/McText";
import {DebounceInput} from "react-debounce-input";

export const ShuffleCollection = () => {

  const [cardItems, setCardItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([{name: "loading", meme: "yes"}]);

  const [availableTags, setAvailableTags] = useState([]);

  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedType, setSelectedType] = useState({value: "gem", label: "Gems"});
  const [selectedRarity, setSelectedRarity] = useState();
  const [searchText, setSearchText] = useState();

  const [filterTags, setFilterTags] = useState([]);

  const bannerText = {};
  bannerText.event = "Event Reward"
  bannerText.transmute = "Transmutation Only"
  bannerText.discontinued = "Discontinued"

  const typeOptions = [
    {value: "any", label: "Any"},
    {value: "gem", label: "Gems"},
    {value: "tome", label: "Tomes"},
    {value: "scroll", label: "Scrolls"},
    {value: "unique", label: "Uniques"}
  ]

  const rarityOptions = [
    {value: "any", label: "Any"},
    {value: "Common", label: "Common"},
    {value: "Uncommon", label: "Uncommon"},
    {value: "Rare", label: "Rare"},
    {value: "Epic", label: "Epic"}
  ]

  useEffect(() => {
    if (cardItems.length === 0) {
      const newItems = [];
      for (const [key, value] of Object.entries(gems)) {
        const item = value;
        item.type = "gem"
        item.img = "https://static.wikia.nocookie.net/minecraft_gamepedia/images/2/26/Emerald_JE3_BE3.png";
        item.background = "#10c810";
        newItems.push(item);
      }
      for (const [key, value] of Object.entries(tomes)) {
        const item = value;
        item.type = "tome";
        item.img = "https://static.wikia.nocookie.net/minecraft_gamepedia/images/5/50/Book_JE2_BE2.png";
        item.background = "#1243d9";
        newItems.push(item);
      }
      for (const [key, value] of Object.entries(uniques)) {
        const item = value;
        item.type = "unique";
        item.img = "https://static.wikia.nocookie.net/minecraft_gamepedia/images/5/50/Book_JE2_BE2.png";
        item.background = "#d99712";
        newItems.push(item);
      }
      for (const [key, value] of Object.entries(scrolls)) {
        const item = value;
        item.type = "scroll";
        item.img = "https://static.wikia.nocookie.net/minecraft_gamepedia/images/f/f2/Paper_JE2_BE2.png";
        item.background = "#34981a";
        newItems.push(item);
      }

      setCardItems(newItems);
      setSelectedTags([]);
    }
  }, []);

  useEffect(() => {
    applyFilters()
  }, [searchText, selectedTags, selectedRarity, selectedType]);

  useEffect(() => {
    const set = new Set(availableTags);
    cardItems.forEach((item) => {
      item.groupNames.forEach((tag) => {
        set.add(tag);
      })
    });
    setAvailableTags(Array.from(set));

    const tags = []
    set.forEach((tag) => {
      tags.push({value: tag, label: tag})
    });
    setFilterTags(tags);
  }, [cardItems]);

  const applyFilters = () => {
    setFilteredItems(
      cardItems
        .filter(item => itemMatchesFilters(item) && tagsApplicable(item) && itemMatchesSearch(item))
        .sort(function(a, b) {
          return a.strippedName < b.strippedName ? -1 : a.strippedName > b.strippedName ? 1 : 0;
        })
    );
  }

  const itemMatchesFilters = (item) => {
    if (selectedRarity && selectedRarity.value !== "any" && item.rarity !== selectedRarity.value) {
      return false;
    }
    if (selectedType && selectedType.value !== "any" && item.type !== selectedType.value) {
      return false;
    }
    return true
  }

  const tagsApplicable = (item) => {
    if (selectedTags.length === 0) return true;
    for (const tag of selectedTags) {
      if (!item.groupNames.includes(tag.value)) return false
    }
    return true;
  }

  const itemMatchesSearch = (item) => {
    if (!searchText) {
      return true;
    }
    return (
      item.name?.toLowerCase().includes(searchText) ||
      item.title?.toLowerCase().includes(searchText) ||
      item.description?.join(" ").toLowerCase().includes(searchText) ||
      item.groupNames?.join(" ").toLowerCase().includes(searchText));
  }

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
    newTags.push({value: newTag, label: newTag});
    setSelectedTags(newTags);
  }

  const clearAllFilters = () => {
    setSelectedTags([]);
    setSelectedType(null);
    setSelectedRarity(null);
    setSearchText("");
  }

  const filterSection = (
    <div className="width100 flexRow align-left padding-full-10">
      <div className="width40 margin-full-5">
        <Select
          placeholder="Item Tags"
          isMulti
          value={selectedTags}
          options={filterTags}
          onChange={setSelectedTags}
        />
      </div>
      <div className="width15 margin-full-5">
        <Select
          placeholder="Type"
          value={selectedType}
          options={typeOptions}
          onChange={setSelectedType}
        />
      </div>
      <div className="width15 margin-full-5">
        <Select
          placeholder="Rarity"
          value={selectedRarity}
          options={rarityOptions}
          onChange={setSelectedRarity}
        />
      </div>
      <div className="width20 margin-full-5 searchBox">
        <DebounceInput
          placeholder="Search Items..."
          debounceTimeout={1000}
          value={searchText}
          forceNotifyByEnter={true}
          forceNotifyOnBlur={true}
          minLength={0}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <div className="width5 margin-full-5 clearButton align-center"
           onClick={clearAllFilters}>
        X</div>
    </div>
  )

  const yeHaplessBuffoon = (
    <div className="shuffleCard" style={{borderColor: "#AA0000"}} key="invalid-search">
      <div className="shuffleContent">
        <div className="shuffleElement">
          <div className="title">⚠ IMPOTENT QUERIER DETECTED ⚠</div>
          <div className="subtitle">HALT! YOU'VE FOUND NO RESULTS!</div>
        </div>
        <div className="shuffleElement">
          <img src="https://i.imgur.com/Coc4Unz.gif" alt="aaaaaaaaaa"/>
        </div>
        <div className="shuffleElement">
          <p className="lore">Please refine your search and/or yourself, ye hapless buffoon</p>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {filterSection}
      <div className="shuffleCards">
        {filteredItems?.length === 0 ? yeHaplessBuffoon : filteredItems.map((item, index) =>
          <div className="shuffleCard shadow-dark" id={`card-${index}`}
               key={`Card-${item.name}-${item?.type}-${index}`}
               style={{borderColor: `${item?.background}`}}>

            <div className={`shadow-dark rarityBanner rarity-${item?.rarity}`}>
              <a className="bannerHitbox" data-tooltip={`Rarity: ${item?.rarity}`}/>
              <p></p>
            </div>

            {item.specialFlag ?
              <div className={`shadow-dark specialBanner special-${item.specialFlag}`}>
                <a className="bannerHitbox" data-tooltip={`${bannerText[item?.specialFlag]}`}/>
                <p></p>
              </div> : undefined}

            <div className="shuffleContent">
              <div className="shuffleElement">
                <McText className="subtitle shuffleElement" prefix={"&"}>{item?.name}</McText>
                <div>
                  {item?.groupNames?.map((tag, index2) =>
                    <button
                      className="tag"
                      key={`tag${index2}`}
                      onClick={() => forceTag(tag)}
                    >{tag}</button>)}
                </div>
                <div className="shuffleElement">
                  <img src={item?.img} alt="Loading..."/>
                </div>
                <div style={{backgroundColor: "black", borderRadius: "5px", margin: "0px 10px"}}>
                  <div className="shuffleElement">
                    {item?.description?.map((line, index2) => (
                      <div>
                        <McText
                          className="lore"
                          prefix={"&"}
                          key={`lore${index2}`}>
                          {line}
                        </McText>
                      </div>)
                    )}
                  </div>
                </div>
                <div style={{marginTop: '10px'}}/>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
};