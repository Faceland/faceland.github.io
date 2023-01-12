import React, {useContext} from "react";
import {HeaderBar} from "../../components/HeaderBar/HeaderBar";
import {Footer} from "../../components/Footer/Footer";
import {Context} from "../../Store";
import {DiscordWidget} from "../../components/DiscordWidget/DiscordWidget"
import './guide.scss'
import {
    Accordion,
    AccordionItem,
    AccordionItemButton,
    AccordionItemHeading,
    AccordionItemPanel
} from "react-accessible-accordion";

export const Guide = (props) => {

    const [state] = useContext(Context);

    return (
        <div className="App Guide">
            <HeaderBar fancy={false}/>
            <div className="basicPage">
                <div style={{
                    maxWidth: '100%',
                    display: "flex",
                    height: 400,
                    justifyContent: "center",
                    overflow: "hidden"
                }}>
                    <img style={{display: "block", width: '100vw', height: '100%', objectFit: "cover"}}
                         src="https://i.imgur.com/q5Czwlv.jpg" alt="info background"/>
                </div>
                <div className="infoBanner shadow-normal">
                    <p>🛈 Faceland Info 🛈</p>
                </div>
                <Accordion style={{backgroundColor: "#57423F", borderRadius: 0}} allowMultipleExpanded={true}
                           allowZeroExpanded={true} preExpanded={["basicOne"]}>
                    <AccordionItem uuid="basicOne">
                        <AccordionItemHeading>
                            <AccordionItemButton>
                                What Is Faceland?
                            </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                            <p>
                                Faceland is a Minecraft server that functions like a classic MMORPG! That basically
                                means that you fight monsters to get stronger, complete quests, and get rare items.
                                The server is 100% free and doesn't feature any pay2win or manipulative
                                micro-transactions. You can join via the IP PLAY.FACE.LAND!
                            </p>
                        </AccordionItemPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionItemHeading>
                            <AccordionItemButton>
                                How Do I Play?
                            </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                            <Accordion style={{borderRadius: 0}} allowMultipleExpanded={true} allowZeroExpanded={true}>
                                <AccordionItem>
                                    <AccordionItemHeading>
                                        <AccordionItemButton>
                                            How To Connect
                                        </AccordionItemButton>
                                    </AccordionItemHeading>
                                    <AccordionItemPanel>
                                        <p>
                                            After connecting to Faceland via your normal Minecraft launcher (IP
                                            PLAY.FACE.LAND)
                                            You'll find yourself in the tutorial area. Be sure to read all floating text
                                            or
                                            signs for help! Pick a starter setup from one of the options presented to
                                            you,
                                            and begin your adventure!
                                        </p>
                                    </AccordionItemPanel>
                                </AccordionItem>
                                <AccordionItem>
                                    <AccordionItemHeading>
                                        <AccordionItemButton>
                                            How To Fight
                                        </AccordionItemButton>
                                    </AccordionItemHeading>
                                    <AccordionItemPanel>
                                        <p>
                                            A lot of the appeal of Faceland comes from combat! Try attacking normally or
                                            pressing your number keys (1-3) to cast abilities. You can open your
                                            inventory
                                            to inspect your abilities further, and see their exact effects.
                                        </p>
                                    </AccordionItemPanel>
                                </AccordionItem>
                                <AccordionItem>
                                    <AccordionItemHeading>
                                        <AccordionItemButton>
                                            How To Use Abilities
                                        </AccordionItemButton>
                                    </AccordionItemHeading>
                                    <AccordionItemPanel>
                                        <p>To use your abilities, press a number key between 1 and 3 with the
                                            appropriate weapon equipped. This will 'cast' the ability, and it'll do the
                                            thing!</p>
                                        <div className="buffer"/>
                                        <p>Abilities appear in your hotbar. You start out with three basic abilities
                                            based on your fighting style choice in the tutorial. But don't worry if you
                                            change your mind! By visiting any Ability Trainer in a town, you can change
                                            your abilities at any time!</p>
                                        <div className="buffer"/>
                                        <p>Abilities often need certain equipment, cost energy, or have additional
                                            requirements. Read the description thoroughly!</p>
                                    </AccordionItemPanel>
                                </AccordionItem>
                                <AccordionItem>
                                    <AccordionItemHeading>
                                        <AccordionItemButton>
                                            Help! My Ability Doesn't Work!
                                        </AccordionItemButton>
                                    </AccordionItemHeading>
                                    <AccordionItemPanel>
                                        <p>If an ability just won't cast, there's probably a reason! First, check to see
                                            if you have the right equipment. In the ability's description it will say
                                            "Equipment: [Weapon Type]". Make sure you have that item held when
                                            casting!</p>
                                        <div className="buffer"/>
                                        <p>Many abilities require energy, and you may not have enough! Your energy is
                                            located where your food bar normally would be, and if it's very low, that
                                            could explain it. Drink a potion or wait a bit for some energy to come
                                            back!</p>
                                        <div className="buffer"/>
                                        <p>Abilities may also have additional requirements that you don't meet. Check
                                            near the top of the description for additional costs such as Life or
                                            Barrier. Check near the middle for red text with the style "[REQ: Being A
                                            Gamer]". In this example case, that text would indicate you need to meet the
                                            requirement of being a gamer, or it won't cast!</p>
                                    </AccordionItemPanel>
                                </AccordionItem>
                            </Accordion>
                        </AccordionItemPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionItemHeading>
                            <AccordionItemButton>
                                Energy? Why Is My Food Bar Weird?
                            </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                            <p>On Faceland, your vanilla food bar reflects your energy, rather than hunger. Energy
                                automatically recharges over time, or can be recovered with items such as potions.
                                Energy is used to attack, sprint, and cast abilities. These actions may not work if your
                                energy is too low. Leveling and some stats can increase your maximum energy or how fast
                                your energy comes back. Watch your energy! You become far less effective when it hits
                                zero!</p>
                        </AccordionItemPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionItemHeading>
                            <AccordionItemButton>
                                Skills And Leveling
                            </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                            <p>When you kill enemies, you get experience. Your normal Minecraft experience bar and level
                                show you your progress and current level. While you lose some experience on death,
                                there's no way to go down in levels. Instead of being used for enchanting, your level
                                gives you Levelpoints, which can be used to increase your stats. Use /levelup every time
                                you go up a level and get stronger!</p>
                            <div className="buffer"/>
                            <p>Skills can be view by using /skills. Each skill unlocks more abilities, increased skill
                                rewards, or improved skill odds what performing various tasks. For example, to gain
                                Enchanting experience you just need to enchant. As you go up in levels, your
                                enchantments become stronger. For combat abilities, the more skilled you become, the
                                more options you have for abilities of that type.</p>
                        </AccordionItemPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionItemHeading>
                            <AccordionItemButton>
                                Quests And QuestPoints
                            </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                            <p>Quests are important on Faceland! Doing /quests will bring up your quest menu, and give
                                you a guide of your current tasks. Completing quests grants various rewards such as
                                items, experience, and unlocking additional quests. Quests are automatically sorted from
                                easiest to hardest in your available quests menu, so doing them in order is
                                recommended.</p>
                            <div className="buffer"/>
                            <p>Quests also grant QuestPoints when completed. Your QuestPoints are a measure of the
                                quantity and difficulty of quests you've completed. They cannot be spent on anything,
                                but instead are kept and unlock things when you have a certain amount. The most common
                                benefits of QuestPoints are extra bank storage pages that unlock when you have enough,
                                and decreasing the amount of Bits (Money) you drop when you die.</p>
                        </AccordionItemPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionItemHeading>
                            <AccordionItemButton>
                                Food And Hunger
                            </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                            <p>Just like real life, on Faceland you need to eat a balanced diet to make it so you're
                                less likely to die. Food can be eaten every 5 minutes, and doing so grants life, energy,
                                and extra effects. Foods also have nutrient values to keep you in good shape. When you
                                have good nutrition, your maximum life increases, and when your nutrition is poor, it
                                decreases. Check /health to see your current bonuses and nutrient levels.</p>
                        </AccordionItemPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionItemHeading>
                            <AccordionItemButton>
                                Why isn't this guide finished?
                            </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                            <p>
                                fuck you
                            </p>
                        </AccordionItemPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionItemHeading>
                            <AccordionItemButton>
                                Why isn't this guide finished?
                            </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                            <p>
                                fuck you
                            </p>
                        </AccordionItemPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionItemHeading>
                            <AccordionItemButton>
                                Why isn't this guide finished?
                            </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                            <p>
                                fuck you
                            </p>
                        </AccordionItemPanel>
                    </AccordionItem>
                </Accordion>
            </div>
            <DiscordWidget/>
            <Footer/>
        </div>
    );
}