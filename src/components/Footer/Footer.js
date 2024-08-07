import * as React from 'react';
import './footer.scss';
import { Buddy } from '../Buddy/Buddy';
import { useContext } from 'react';
import { Context } from '../../Store';

export const Footer = (props) => {
  const [state] = useContext(Context);

  return (
    <div className="Footer">
      <Buddy />
      <footer className="footer">
        <div className="footer__addr">
          <h1 className="footer__logo">Faceland RPG</h1>

          <address>
            1234 ImNotGivingYouWeirdosMyAddress Blvd 42069
            <p>&copy; 2023 Faceland LLC. All rights reserved.</p>
            <p>
              Faceland proudly uses textures from the amazing{' '}
              <a
                style={{ color: 'white', textDecoration: 'underline' }}
                href="https://www.curseforge.com/minecraft/texture-packs/excalibur"
              >
                Excalibur 16x
              </a>
            </p>
            <p>Faceland is not an official Minecraft product and is not associated with Mojang or Microsoft</p>
          </address>
        </div>

        <ul className="footer__nav">
          <li className="nav__item">
            <h2 className="nav__title">Social Media</h2>

            <ul className="nav__ul">
              <li>
                <a href="https://twitter.com/facelandr">Twitter</a>
              </li>

              <li>
                <a href="https://twitter.com/facelandr">Still Twitter</a>
              </li>

              <li>
                <a href="https://twitter.com/facelandr">
                  Send help, it's just Twitter
                </a>
              </li>
            </ul>
          </li>

          <li className="nav__item">
            <h2 className="nav__title">External Links</h2>

            <ul className="nav__ul">
              <li>
                <a href="http://199.127.61.235:8100/#Quest_world:27:0:893:506:0:0:0:0:perspective">
                  World Map
                </a>
              </li>

              <li>
                <a href="https://discord.gg/Gkmk6G2fjd">Discord</a>
              </li>

              <li>
                <a href="https://shop.face.land">Cash Shop</a>
              </li>
            </ul>
          </li>

          <li className="nav__item">
            <h2 className="nav__title">Contact</h2>

            <ul className="nav__ul">
              <li>
                <a
                  className="footer__btn"
                  href="mailto:official.faceland@gmail.com"
                >
                  Email Us
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </footer>
    </div>
  );
};
