import React, {useState} from "react";
import { ReactComponent as CopyIcon } from "../../assets/copy.svg"
import './copyWidget.scss'
import "../Tooltip/tooltip.scss"

export const CopyWidget = (props) => {

    const [copyStatus, setCopyStatus] = useState("Click To Copy!");
    let timeout;

    const copyTransition = () => {
        timeout && clearTimeout(timeout);
        setCopyStatus("Copied!")
        timeout = setTimeout(() => {
            setCopyStatus("Click To Copy!");
        }, 2000);
    }

    return (
        <div
            className="copyButton theme-primary shadow-normal"
            onClick={() => {
                copyTransition();
                navigator.clipboard.writeText(props.copyText);
            }}
            data-tooltip={copyStatus}
        >
            <CopyIcon style={{fill: 'whitesmoke', height: 18}}/>
            <span className="divider"/>
            <span>{props.copyText}</span>
        </div>
    );
}