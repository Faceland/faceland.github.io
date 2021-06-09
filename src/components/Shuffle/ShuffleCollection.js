import React, {useState, useEffect} from "react";
import {debounce} from 'lodash';
import "./Shuffle.scss"
import "../Tooltip/tooltip.scss"
import gems from "./gems.json"
import tomes from "./tomes.json"
import McText from "mctext-react/lib/McText";

export const ShuffleCollection = () => {

    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([{name: "loading", meme: "yes"}]);
    const [filter, setFilter] = useState({});
    const [searchText, setSearchText] = useState("");
    const [searchTags, setSearchTags] = useState([]);
    const [uniqueTags, setUniqueTags] = useState([]);

    const bannerText = {};
    bannerText.event = "Event Reward"
    bannerText.transmute = "Transmutation Only"
    bannerText.discontinued = "Discontinued"

    useEffect(() => {
        if (items.length === 0) {
            const newItems = [];
            for (const [key, gem] of Object.entries(gems)) {
                const item = {};
                item.title = "SOCKET GEM"
                item.name = key;
                item.type = "gem"
                item.description = gem.lore;
                item.special = gem.weight === 0 && gem['bonus-weight'] > 0 ?
                    "transmute" : gem.event === true ?
                        "event" : gem.discontinued === true ?
                            "discontinued" : undefined;
                item.tags = mapGroupsToTags(gem['item-groups'])
                item.img = "https://static.wikia.nocookie.net/minecraft_gamepedia/images/2/26/Emerald_JE3_BE3.png";
                item.background = "#10c810";
                item.rarity = gem.weight > 500 ? "Common" : gem.weight > 50 ? "Uncommon" : gem.weight > 5 ? "Rare" : gem.weight > 0 ? "Epic" : "Unique";
                newItems.push(item);
            }

            for (const [key, value] of Object.entries(tomes)) {
                const item = {};
                item.title = "ENCHANTMENT TOME";
                item.name = key;
                item.type = "tome";
                item.description = [value.description];
                item.tags = mapGroupsToTags(value['item-groups'])
                item.img = "https://static.wikia.nocookie.net/minecraft_gamepedia/images/5/50/Book_JE2_BE2.png";
                item.background = "#1243d9";
                item.rarity = value.weight > 500 ? "Common" : value.weight > 200 ? "Uncommon" : "Rare";
                newItems.push(item);
            }
            setItems(newItems);
            setSearchTags([]);
        }
    }, []);

    useEffect(() => {
        applyFilters()
    }, [filter, searchText, searchTags]);

    useEffect(() => {
        const set = new Set(uniqueTags);
        if (set.size !== uniqueTags.length) {
            setUniqueTags(Array.from(set));
        }
    }, [uniqueTags])

    const mapGroupsToTags = (groups) => {
        const tags = []
        groups.forEach((group) => {
            if (!group.startsWith("-")) {
                const tag = group.toLowerCase();
                tags.push(tag);
                if (!uniqueTags.includes(tag)) {
                    setUniqueTags(uniqueTags => [...uniqueTags, tag]);
                }
            }
        });
        console.log("test", tags)
        return tags;
    }

    const applyFilters = () => {
        setFilteredItems(items.filter(item => itemMatches(item) && itemMatchesSearch(item)));
    }

    const checkMatch = (property, value, strict) => {
        return strict ? property === value : property.includes(value);
    }

    const itemMatches = (item) => {
        let match = true;
        for (const prop in filter) {
            if (match && Object.prototype.hasOwnProperty.call(filter, prop) && filter[prop]) {
                if (!checkMatch(item[prop], filter[prop].value, filter[prop].strict)) {
                    match = false;
                    break;
                }
            }
        }
        return match;
    }

    const tagsApplicable = (item) => {
        if (searchTags.length === 0) return true;
        for (const tag of searchTags) {
            if (!item.tags.includes(tag)) return false
        }
        return true;
    }

    const itemMatchesSearch = (item) => {
        return tagsApplicable(item) && (!searchText ||
            item.name?.toLowerCase().includes(searchText) ||
            item.title?.toLowerCase().includes(searchText) ||
            item.description?.join(" ").toLowerCase().includes(searchText) ||
            item.tags?.join(" ").toLowerCase().includes(searchText))
    }

    const toggleTag = (tag) => {
        const newTags = Object.assign([], searchTags);
        searchTags.includes(tag) ? newTags.splice(newTags.indexOf(tag), 1) : newTags.push(tag);
        setSearchTags(newTags);
    }

    const forceTag = (tag) => {
        if (searchTags.includes(tag)) return;
        const newTags = Object.assign([], searchTags);
        newTags.push(tag);
        setSearchTags(newTags);
        setSearchText("");
        setFilter({...filter, type: undefined})
    }

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

    const rarityButton = (prop, text) => (
        <button className={`selectorButton-${filter.rarity?.value === `${text}` ? "active" : "inactive"}`}
                onClick={() => setFilter({...filter, rarity: {value: `${text}`, strict: "true"}})}>
            {text}
        </button>
    )

    const itemTypeButton = (prop, text) => (
        <button className={`selectorButton-${filter.type?.value === `${text}` ? "active" : "inactive"}`}
                onClick={() => setFilter({...filter, type: {value: `${text}`, strict: "true"}})}>
            {text}
        </button>
    )

    return (
        <div>
            <div>
                <div>FILTER BY TAG</div>
                {uniqueTags.map((tag, index) =>
                    <button
                        className={`selectorButton-${searchTags.includes(tag) ? "active" : "inactive"}`}
                        key={"toggle" + index}
                        onClick={() => toggleTag(tag)}>
                        {tag}
                    </button>
                )}
                <button type="checkbox" className="selectorButton-clear" onClick={() => setSearchTags([])}>Clear
                </button>
            </div>
            <div>
                <div>FILTER BY ITEM TYPE</div>
                <button className={`selectorButton-${!filter.type?.value ? "active" : "inactive"}`}
                        onClick={() => setFilter({
                            ...filter,
                            type: undefined
                        })}>
                    ANY
                </button>
                {itemTypeButton("itemType", "gem")}
                {itemTypeButton("itemType", "tome")}
            </div>
            <div>
                <div>FILTER BY RARITY</div>
                <button className={`selectorButton-${!filter.rarity?.value ? "active" : "inactive"}`}
                        onClick={() => setFilter({...filter, rarity: undefined})}>
                    ANY
                </button>
                {rarityButton("rarity", "Common")}
                {rarityButton("rarity", "Uncommon")}
                {rarityButton("rarity", "Rare")}
                {rarityButton("rarity", "Epic")}
                {rarityButton("rarity", "Unique")}

            </div>
            <div>
                <div>SEARCH</div>
                <input onChange={debounce((e) => setSearchText(e.target.value.toLowerCase()), 1000)}/>
            </div>
            <div className="shuffleCards">
                {filteredItems?.length === 0 ? yeHaplessBuffoon : filteredItems.map((item, index) =>
                    <div className="shuffleCard shadow-dark"
                         key={`Card-${item.name}-${item?.type}-${index}`}
                         style={{borderColor: `${item?.background}`}}>

                        <div className={`shadow-dark rarityBanner rarity-${item?.rarity}`}>
                            <a className="bannerHitbox" data-tooltip={`Rarity: ${item?.rarity}`}/>
                            <p></p>
                        </div>

                        {item.special ?
                            <div className={`shadow-dark specialBanner special-${item.special}`}>
                                <a className="bannerHitbox" data-tooltip={`${bannerText[item?.special]}`}/>
                                <p></p>
                            </div> : undefined}

                        <div className="shuffleContent">
                            <div className="shuffleElement">
                                <div className="title">{item?.title}</div>
                                <div className="subtitle">
                                    <div className="shuffleElement">{item?.name}</div>
                                </div>
                                <div>
                                    {item?.tags?.map((tag, index2) =>
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