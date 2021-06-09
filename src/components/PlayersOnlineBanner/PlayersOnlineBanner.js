import React, {useState, useEffect} from 'react';
import './PlayersOnlineBanner.scss'

export const PlayersOnlineBanner = (props) => {

    const [playersMessage, setPlayersMessage] = useState("Loading...");
    let timer;

    useEffect(() => {
        fetchStatus()
        return () => {
            timer && clearTimeout(timer);
        };
    }, []);

    const fetchStatus = () => {
        fetch("https://api.mcsrvstat.us/2/199.127.61.235:25566")
            .then(res => res.json())
            .then(
                (result) => {
                    console.log("result", result)
                    if (!result || !result.online || result.players === undefined) {
                        setPlayersMessage("Dang son! Faceland appears to be offline!");
                    } else {
                        setPlayersMessage("There are " + result.players.online + " gamers GAMING!")
                    }
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.log("Failed to get player online", error)
                }
            );
        timer = setTimeout(() => {
            fetchStatus()
        }, 60000)
    }

    return (
        <div className="playersOnlineBanner shadow-normal">
            <p>{playersMessage}</p>
        </div>
    );
}