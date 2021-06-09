import * as React from "react";
import './footer.scss'
import {Buddy} from "../Buddy/Buddy";

export const Footer = (props) => {

    return (
        <div className="Footer">
            <Buddy/>
            <div className="footer">
                <div className="flexRow width100">
                    <div className="footerSection flexCol width40">
                        <img className="pixelImage width40" style={{opacity: 0.4}} src="https://i.imgur.com/Uf1s8wX.png"
                             alt="emboss_logo"/>
                    </div>
                    <div className="footerSection flexCol width60">
                        <div className="flexRow width100">
                            <div className="flexCol width50" style={{alignItems: "flex-start"}}>
                                <h4 className="thin-underline">GAMERS</h4>
                                <div>Home</div>
                                <div>Info</div>
                                <div>Contact</div>
                                <div>Discord</div>
                                <div>Privacy Policy</div>
                            </div>
                            <div className="flexCol width50" style={{alignItems: "flex-start"}}>
                                <h4 className="thin-underline">GAMERS</h4>
                                <div>Home</div>
                                <div>Info</div>
                                <div>Contact</div>
                                <div>Discord</div>
                                <div>Privacy Policy</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flexRow width100">
                    COPYRIGHT YOUR MOTHER LMFAO
                </div>
            </div>
        </div>
    )
}