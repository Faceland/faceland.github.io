import React from "react";
import '../../App.scss'
import './primaryButton.scss'

export const PrimaryButton = (props) => {
    return (
        <button onClick={props.onClick} className="primaryButton shadow-normal theme-primary mx-1">
            {props.children}
        </button>
    );
}