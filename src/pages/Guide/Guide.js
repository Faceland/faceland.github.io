import React, { useContext, useState, useEffect, useRef } from 'react';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { Footer } from '../../components/Footer/Footer';
import { Context } from '../../Store';
import { DiscordWidget } from '../../components/DiscordWidget/DiscordWidget';
import { SEO } from '../../components/SEO/SEO';
import './guide.scss';

const FaqItem = ({ question, image, children, isOpen, onToggle }) => {
  return (
    <div className="faq-item">
      <button
        className={`faq-question ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        {question}
      </button>
      <div className={`faq-answer ${isOpen ? 'open' : ''}`}>
        <div className="faq-answer-inner">
          <div className="faq-answer-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const faqData = [
  {
    id: 'what-is-faceland',
    question: 'What Is Faceland?',
    image: '/assets/guides/what-is-faceland.png',
    caption: 'Welcome to Faceland!',
  },
  {
    id: 'how-to-play',
    question: 'How Do I Play?',
    image: '/assets/guides/connect-guide.png',
    caption: 'No mods required! Yipee!',
    children: [
      {
        id: 'how-to-connect',
        question: 'How To Connect',
        image: '/assets/guides/connect-guide.png',
        caption: 'Connect using the IP: BETA.FACE.LAND',
      },
      {
        id: 'how-to-fight',
        question: 'How To Fight',
        image: '/assets/guides/combat-example.png',
        caption: 'Combat in Faceland uses both abilities and normal attacks!',
      },
      {
        id: 'how-to-use-abilities',
        question: 'How To Use Abilities',
        image: '/assets/guides/ability-picker.png',
        caption: 'Press 1-4 to cast abilities with your weapon equipped!',
      },
      {
        id: 'ability-not-working',
        question: "Help! My Ability Doesn't Work!",
        image: '/assets/guides/requirement-not-met.png',
        caption: 'Check your equipment, energy, and requirements! (Reading required)',
      },
    ],
  },
  {
    id: 'energy',
    question: 'Energy? Why Is My Food Bar Weird?',
    image: '/assets/guides/energy-example.png',
    caption: 'Burning energy to get that bread',
  },
  {
    id: 'skills-leveling',
    question: 'Skills And Leveling',
    image: '/assets/guides/skill-screen.png',
    caption: 'Grind them skillz for more speed and cool perks!',
  },
    {
        id: 'quests',
        question: 'Quests And QuestPoints',
        image: '/assets/guides/quest-screen.png',
        caption: 'Complete quests for rewards!',
    },
    {
        id: 'banking',
        question: 'Item And Money Storage',
        image: '/assets/guides/bank-view.png',
        caption: 'Store money and items at the bank!',
    },
];

const faqContent = {
  'what-is-faceland': (
    <p>
      Faceland is a Minecraft server that functions like a classic
      MMORPG! That basically means that you fight monsters to get
      stronger, complete quests, and get rare items. The server is
      100% free and doesn't feature any pay2win or manipulative
      micro-transactions. You can join via the IP BETA.FACE.LAND!
    </p>
  ),
  'how-to-connect': (
    <p>
      After connecting to Faceland via your normal Minecraft
      launcher (IP BETA.FACE.LAND) You'll find yourself in the
      tutorial area. Be sure to read all floating text or signs
      for help! Pick a starter setup from one of the options
      presented to you, and begin your adventure!
    </p>
  ),
  'how-to-fight': (
    <p>
      A lot of the appeal of Faceland comes from combat! Try
      attacking normally or pressing your number keys (1-4) to
      cast abilities. You can open your inventory to inspect
      your abilities further, and see their exact effects.
    </p>
  ),
  'how-to-use-abilities': (
    <>
      <p>
        To use your abilities, press a number key between 1 and 3
        with the appropriate weapon equipped. This will 'cast' the
        ability, and it'll do the thing!
      </p>
      <div className="buffer" />
      <p>
        Abilities appear in your hotbar. You start out with three
        basic abilities based on your fighting style choice in the
        tutorial. But don't worry if you change your mind! By
        visiting any Ability Trainer in a town, you can change
        your abilities at any time!
      </p>
      <div className="buffer" />
      <p>
        Abilities often need certain equipment, cost energy, or
        have additional requirements. Read the description
        thoroughly!
      </p>
    </>
  ),
  'ability-not-working': (
    <>
      <p>
        If an ability just won't cast, there's probably a reason!
        First, check to see if you have the right equipment. In
        the ability's description it will say "Equipment: [Weapon
        Type]". Make sure you have that item held when casting!
      </p>
      <div className="buffer" />
      <p>
        Many abilities require energy, and you may not have
        enough! Your energy is located where your food bar
        normally would be, and if it's very low, that could
        explain it. Drink a potion or wait a bit for some energy
        to come back!
      </p>
      <div className="buffer" />
      <p>
        Abilities may also have additional requirements that you
        don't meet. Check near the top of the description for
        additional costs such as Life or Barrier. Check near the
        middle for red text with the style "[REQ: Being A Gamer]".
        In this example case, that text would indicate you need to
        meet the requirement of being a gamer, or it won't cast!
      </p>
    </>
  ),
  'energy': (
    <p>
      On Faceland, your vanilla food bar reflects your energy, rather
      than hunger. Energy automatically recharges over time, or can be
      recovered with items such as potions. Energy is used to attack,
      sprint, and cast abilities. These actions may not work if your
      energy is too low. Leveling and some stats can increase your
      maximum energy or how fast your energy comes back. Watch your
      energy! You become far less effective when it hits zero!
    </p>
  ),
  'skills-leveling': (
    <>
      <p>
        When you kill enemies, you get experience. Your normal Minecraft
        experience bar and level show you your progress and current
        level. While you lose some experience on death, there's no way
        to go down in levels. Instead of being used for enchanting, your
        level gives you Levelpoints, which can be used to increase your
        stats. Use /levelup every time you go up a level and get
        stronger!
      </p>
      <div className="buffer" />
      <p>
        Skills can be view by using /skills. Each skill unlocks more
        abilities, increased skill rewards, or improved skill odds what
        performing various tasks. For example, to gain Enchanting
        experience you just need to enchant. As you go up in levels,
        your enchantments become stronger. For combat abilities, the
        more skilled you become, the more options you have for abilities
        of that type.
      </p>
    </>
  ),
    'quests': (
        <>
            <p>
                Quests are important on Faceland! Doing /quests will bring up
                your quest menu, and give you a guide of your current tasks.
                Completing quests grants various rewards such as items,
                experience, and unlocking additional quests. Quests are
                automatically sorted from easiest to hardest in your available
                quests menu, so doing them in order is recommended.
            </p>
            <div className="buffer" />
            <p>
                Quests also grant QuestPoints when completed. Your QuestPoints
                are a measure of the quantity and difficulty of quests you've
                completed. They cannot be spent on anything, but instead are
                kept and unlock things when you have a certain amount. The most
                common benefits of QuestPoints are extra bank storage pages that
                unlock when you have enough, and decreasing the amount of Bits
                (Money) you drop when you die.
            </p>
        </>
    ),
    'banking': (
        <>
            <p>
                When you die, you drop most of your carried money, and can
                randomly drop some of your items that aren't equipped! To
                prevent this, be sure to store extra cash and items at the
                bank! There's on in every town!
            </p>
        </>
    ),
};

export const Guide = () => {
  const [state] = useContext(Context);
  const [openItems, setOpenItems] = useState(['what-is-faceland']);
  const [currentImage, setCurrentImage] = useState('/assets/guides/what-is-faceland.png');
  const [currentCaption, setCurrentCaption] = useState('Welcome to Faceland - a free-to-play Minecraft MMORPG!');
  const [imageExpanded, setImageExpanded] = useState(false);
  const [imageClosing, setImageClosing] = useState(false);
  const [expandOrigin, setExpandOrigin] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const imageWrapperRef = useRef(null);
  const [imageTop, setImageTop] = useState(10);
  const faqContainerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!faqContainerRef.current || !imageRef.current || state.mobile) return;

      const faqRect = faqContainerRef.current.getBoundingClientRect();
      const faqHeight = faqContainerRef.current.offsetHeight;
      const imageHeight = imageRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;

      const idealTop = (viewportHeight - imageHeight) / 2;
      const minTop = 10;
      const maxTop = faqHeight - imageHeight - 10;

      let newTop = idealTop - faqRect.top;
      newTop = Math.max(minTop, Math.min(newTop, maxTop));

      setImageTop(newTop);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [state.mobile, openItems]);

  const handleExpandImage = () => {
    if (imageWrapperRef.current) {
      const rect = imageWrapperRef.current.getBoundingClientRect();
      setExpandOrigin({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
      setImageExpanded(true);
    }
  };

  const handleCloseImage = () => {
    setImageClosing(true);
    setTimeout(() => {
      setImageExpanded(false);
      setImageClosing(false);
    }, 200);
  };

  const handleToggle = (id, image, caption) => {
    setOpenItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        setCurrentImage(image);
        setCurrentCaption(caption);
        return [...prev, id];
      }
    });
  };

  const renderFaqItem = (item) => {
    const isOpen = openItems.includes(item.id);

    return (
      <FaqItem
        key={item.id}
        question={item.question}
        image={item.image}
        isOpen={isOpen}
        onToggle={() => handleToggle(item.id, item.image, item.caption)}
      >
        {item.children ? (
          <div className="sub-faq">
            {item.children.map((child) => renderFaqItem(child))}
          </div>
        ) : (
          faqContent[item.id]
        )}
      </FaqItem>
    );
  };

  return (
    <div className="App Guide">
      <SEO
        title="Beginner's Guide"
        description="Learn how to play Faceland, the free Minecraft MMORPG! Complete guide covering abilities, combat, skills, quests, energy system, and more. Start your adventure today!"
      />
      <HeaderBar fancy={false} />
      <div className="basicPage">
        <div
          style={{
            maxWidth: '100%',
            display: 'flex',
            height: 400,
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img
            style={{
              display: 'block',
              width: '100vw',
              height: '100%',
              objectFit: 'cover',
            }}
            src="/assets/images/guide-bkg.png"
            alt="info background"
          />
        </div>
        <div className="infoBanner shadow-normal">
          <p>Faceland Guide For Epic Gamers</p>
        </div>

        <div
          className="faq"
          ref={faqContainerRef}
          style={{ backgroundImage: 'url(/assets/textures/dirt.png)' }}
        >
          <div className={`faq-list ${state.mobile ? 'full-width' : ''}`}>
            {faqData.map((item) => renderFaqItem(item))}
          </div>
          {!state.mobile && (
            <div
              className="faq-image"
              ref={imageRef}
              style={{ transform: `translateY(${imageTop}px)` }}
              onClick={handleExpandImage}
            >
              <div className="faq-image-wrapper" ref={imageWrapperRef}>
                <img src={currentImage} alt="FAQ illustration" />
                <svg
                  className="faq-magnify-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M11 8V14M8 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="faq-image-caption">{currentCaption}</p>
            </div>
          )}
          {imageExpanded && (
            <div className="faq-image-overlay" onClick={handleCloseImage}>
              <div
                className={`faq-image-expanded ${imageClosing ? 'closing' : ''}`}
                style={{
                  '--origin-x': `${expandOrigin.x}px`,
                  '--origin-y': `${expandOrigin.y}px`,
                  '--origin-width': `${expandOrigin.width}px`,
                  '--origin-height': `${expandOrigin.height}px`,
                }}
              >
                <img src={currentImage} alt="FAQ illustration expanded" />
                <p className="faq-image-expanded-caption">{currentCaption}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <DiscordWidget />
      <Footer />
    </div>
  );
};
