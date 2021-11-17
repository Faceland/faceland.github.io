import React from "react";
import Ticker from "react-ticker";

import './quoteTicker.scss'

export const QuoteTicker = () => {

    const quotes = [
        {text: "An incredible GAMING experience..", author: "Gamers LTD"},
        {text: "It's the 'Mario Pissing' of MMORPGs!", author: "Faceguy"},
        {text: "This game made me shit myself - In a good way!", author: "You, probably"},
        {text: "Wow! Another Minecraft RPG!", author: "minecraft-servers-list.gov"},
        {text: "I need OP to review your server, or it will be removed...", author: "PMC Server Reviewer"},
        {text: "Uninspired!", author: "Some Dominion Clown"},
        {text: "Please call home son, we don't know what we did wrong but we miss you.", author: "My Mom"}
    ]

    const getQuote = (index) => {
        const newIndex = (index + 1) % quotes.length;
        const quote = quotes[newIndex];
        return (
            <div className="quoteText">
                <h3 className="quoteBody">❝ {quote?.text}❞</h3>
                <p className="quoteSubtext">-{quote?.author}</p>
            </div>
        )
    }

    return (
        <div className="quoteTicker">
            <Ticker>
                {({ index }) => getQuote(index)}
            </Ticker>
        </div>
    );
}