import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import DocTable from '~/components/DocTable';

import CssDoc from '~/layouts/CssDoc'
import MasterSvg from '~/svgs/Master';
import MasterSaid from '~/components/MasterSaid';

import TailwindCSSSvg from '~/svgs/tailwindcss.svg';
import BootstrapSvg from '~/svgs/bootstrap.svg';
import { Trans } from 'next-i18next';
import Code from '~/components/Code';
import DroppedCode from '~/components/DroppedCode';
import CodeTabs from '~/components/Code/CodeTabs';

import ExpressiveStyles from '~/examples/docs/why/ExpressiveStyles.tsx?clearCodeTokens';
import codeOfExpressiveStylesExample from '~/examples/docs/why/ExpressiveStyles.tsx?react2markup';
import ALink from '~/components/ALink';
import Image from 'next/image';
import InteractingIndicator from '~/components/InteractingIndicator';

import StyleAnElementBasedOnTargetStateExample from '~/examples/docs/syntax/StyleAnElementBasedOnTargetState.tsx?clearCodeTokens';
import codeOfStyleAnElementBasedOnTargetStateExample from '~/examples/docs/syntax/StyleAnElementBasedOnTargetState.tsx?react2markup';
import codeOfStyleASiblingBehindExample from '~/examples/docs/syntax/StyleASiblingBehind.tsx?react2markup';

export default function Why({ t }: any) {
    return (
        <>
            <p>{t('This article goes through the concepts behind Master CSS, and offers our solutions to common issues.')}</p>

            <hr />

            <h2 id="virtual-css-engine">{t('Virtual CSS engine')}</h2>
            <p>
                <Trans i18nKey='$VirtualCSSEngine' t={t}>
                    Master CSS&#39;s Virtual CSS engine allows you to style without the complexities of existing approaches —— <b>You can style inside HTML with our enhanced syntax</b>.
                </Trans>
            </p>
            <MasterSaid>{t('Virtual CSS is the concept of expressing real CSS rules through enhanced syntax.')}</MasterSaid>
            <figure>
                <Image src="/images/virtual-css-principle.svg" alt="Virtual CSS" width="750" height="346" className="bg:fade-20@light" />
                <figcaption>
                    {t('A virtual style sheet is kept in memory and synced with the real CSS style sheet.')}
                </figcaption>
            </figure>
            <p>{t('The above conceptual illustration describes the processes Master CSS goes through:')}</p>
            <ol>
                <li>{t('Observe all class names in the DOM')}</li>
                <li>{t('A diffing algorithm detects class name changes')}</li>
                <li>{t('Create its corresponding style instance after matching the class name.')}</li>
                <li>{t('Parsing of style code into core section/types, such as selectors, media queries,...')}</li>
                <li>{t('Creation of CSS rules')}</li>
                <li>{t('Intelligently order generated rules according to selectors and breakpoints')}</li>
                <li>{t('Insertion of CSS rules into the DOM')}</li>
                <li>{t('Removal of appropriate CSS rules')}</li>
            </ol>
            <Trans i18nKey='$ForDetail' t={t}>
                For details, take a look at <a href="https://github.com/master-co/css" target="blank">the source code on Github</a>.
            </Trans>
            <h3 id="automatically-generate-rules">{t('Automatically generate rules')}</h3>
            <p>
                <Trans i18nKey='$HowWritingCSS' t={t}>
                    How do we style without writing CSS? Let&#39;s go through an example of a familiar situation:
                </Trans>
            </p>
            <p>
                <Trans i18nKey='$SetSectionBackground' t={t} shouldUnescape={true}>
                    &#34;Let&#39;s create a <code>section</code> with background, interactive effects, and increase its padding when width <code>&gt;=1024</code>.&#34;
                </Trans>
            </p>
            <Code lang="html">{`
                <section>...</section>
            `}</Code>
            {(() => {
                const code1 = /* html */ `<section class="**home-section**">...</section>`
                const code2 = /* css */ `
                    .home-section {
                        background-color: blue;
                        padding: 2rem;
                        text-align: center;
                    }
                    
                    .home-section:hover {
                        background-color: red;
                    }

                    @media (min-width: 1024px) {
                        .home-section {
                            padding: 3rem;
                        }
                    }
                `
                const code3 = /* html */ `<section class="**bg:blue** **bg:red:hover** **p:32** **p:48@md** **text:center**">...</section>`
                return (
                    <>
                        <p>
                            <Trans i18nKey='$AMinutePassed' t={t}>
                                A minute passes... &#34;Ok, Let&#39;s name it <code>home-section</code>.&#34;
                            </Trans>
                        </p>
                        <Code lang="html">{code1}</Code>
                        <p>
                            <Trans i18nKey='$OpenTheCSSFile' t={t}>
                                Open/create the corresponding <code>home.css</code> file or style tag. Finally we can start writing some CSS:
                            </Trans>
                        </p>
                        <Code lang="css" name="home.css" lineNumbers addLines={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]}>{code2}</Code>
                        <p>
                            <Trans i18nKey='$WhatisWrong' t={t}>
                                &#34;What&#39;s wrong with this process? It&#39;s quite typical.&#34; Yes, the result is fine, but productivity optimization is a core tenent of Master CSS.
                            </Trans>
                        </p>
                        <p>
                            <Trans i18nKey='$UseMasterCSS' t={t}>
                                Let us use Master CSS to achieve the same result. It&#39;s a one-liner and no separate file needed.<DroppedCode p1={code1 + code2} p2={code3} t={t} />
                            </Trans>
                        </p>
                        <Code lang="html">{code3}</Code>
                    </>
                )
            })()}
            <p>{t('Using Master CSS we can write less code to achieve the same result, and avoid the overhead of naming things.')}</p>
            <p>
                <Trans i18nKey='$ActualCSS' t={t}>
                    What about the actual CSS? It&#39;s been injected onto the DOM:
                </Trans>
            </p>
            <Code lang="css">{`
                /* ${t('Actual output would be minified. This output is formatted.')} */
                .p\\:32 {
                    padding: 2rem
                }

                .text\\:center {
                    text-align: center
                }

                .bg\\:blue {
                    background-color: #175fe9
                }

                .bg\\:red\\:hover:hover {
                    background-color: #d11a1e
                }

                @media (min-width:1024px) {
                    .p\\:48\\@md {
                        padding: 3rem
                    }
                }
            `}</Code>
            <p>
                <Trans i18nKey='$OutputAppearsToBeLonger' t={t}>
                    This output appears to be longer than the hand-coded <code>home.css</code> example above? That&#39;s right, but the overall output would be less. We will show this later.
                </Trans>
            </p>
            <MasterSaid>
                <Trans i18nKey='$WithMaster' t={t}>
                    With Master, writing CSS directly is &#34;pure overhead.&#34; Instead, it&#39;s auto-generated for you.
                </Trans>
            </MasterSaid>
            <h3 id="smartly-sort-rules">{t('Intelligent rule sorting')}</h3>
            <p>
                <Trans i18nKey='$CssRuleOrder' t={t}>
                    So how is CSS rule order and priority handled? Let&#39;s see a common example:
                </Trans>
            </p>
            <p>
                <Trans i18nKey='$HomePageHeadline' t={t} shouldUnescape={true}>
                    &#34;Center-align the homepage headline when screen width <code>&gt;=1280px</code>, and align right when <code>&gt;=1024px</code>.&#34;
                </Trans>
            </p>
            <Code lang="css" name="home.css">{`
                @media (min-width:1280px) {
                    h1 {
                        text-align: center;
                    }
                }

                @media (min-width:1024px) {
                    h1 {
                        text-align: right;
                    }
                }
            `}</Code>
            <p>
                <Trans i18nKey='$CSSAboveIsIncorrect' t={t} shouldUnescape={true}>
                    The CSS above is incorrect. Because due to CSS priority, when the screen width <code>&gt;=1024px</code> or <code>&gt;=1280px</code>, <code>@media (min-width:1024px)</code> gets applied, but <code>@media (min-width:1280px)</code> never gets applied.
                </Trans>
            </p>
            <p>{t('This seemingly simple CSS behavior is the source of common mistakes. When there are many such behaviors, unexpected complexities arise.')}</p>
            <p>{t('Simplify by letting Master CSS handle the priority order for you.')}</p>
            <Code lang="html">{`
                <h1 class="**text:right@md** **text:center@lg**">...</h1>
                <!-- or -->
                <h1 class="**text:center@lg** **text:right@md**">...</h1>
            `}</Code>
            <p>{t('No matter how you order rules in our syntax, the correct ordering is generated in the output:')}</p>
            <Code lang="css">{`
                @media (min-width:1024px) {
                    .text\\:right\\@md {
                        text-align: right
                    }
                }

                @media (min-width:1280px) {
                    .text\\:center\\@lg {
                        text-align: center
                    }
                }
            `}</Code>
            <p>
                <Trans i18nKey='$NotOnlyThat' t={t} shouldUnescape={true}>
                    Not only that. When you use selectors <code>:disabled</code>, <code>:active</code>, <code>:focus</code>, <code>:hover</code>, <code>:where()</code>,... or breakpoints <code>@lg</code>, <code>@sm&＜lg</code>,... Master would order rules matching your expectations. So you would rarely, if ever, need to use <code>!important</code>.
                </Trans>
            </p>
            <p>
                <Trans i18nKey='$AnExample' t={t}>
                    An example of this can be seen in the animation on our <ALink href="https://css.master.co#experience">front page</ALink>.
                </Trans>
            </p>
            <h3 id="common-unit-conversions">{t('Common unit conversions')}</h3>
            <p>
                <Trans i18nKey='$WhenEngineeringUI' t={t}>
                    When engineering UI, pixel is the common unit to consider. It&#39;s not as simple for the browser and CSS.
                </Trans>
            </p>
            <p>
                <Trans i18nKey='$ForExample2' t={t}>
                    For example, to find the optimal <code>rem</code> value for the text size of <code>24px</code>, We&#39;d need to calculate: <code>24/16=1.5rem</code>
                </Trans>
            </p>
            <DocTable className="overflow-x:auto {px:20;mx:-20}@<sm">
                <tbody className="text:center">
                    <tr>
                        <th><p>px</p></th>
                        <td><p>12</p></td>
                        <td><p>14</p></td>
                        <td><p>16</p></td>
                        <td><p>18</p></td>
                        <td><p>20</p></td>
                        <td><p>22</p></td>
                        <td><p>24</p></td>
                        <td><p>26</p></td>
                        <td><p>28</p></td>
                    </tr>
                    <tr>
                        <th><p>rem</p></th>
                        <td><p>.75</p></td>
                        <td><p>.875</p></td>
                        <td><p>1</p></td>
                        <td><p>1.125</p></td>
                        <td><p>1.25</p></td>
                        <td><p>1.375</p></td>
                        <td><p>1.5</p></td>
                        <td><p>1.625</p></td>
                        <td><p>1.75</p></td>
                    </tr>
                </tbody>
            </DocTable>
            <Code lang="html">{`
                <h1 class="**font:1.5rem**">...</h1>
            `}</Code>
            <p>{t('You might say that this process is fine. But one may need to go through this process tens or hundreds of times.')}</p>
            <p>
                <Trans i18nKey='$WithMasterCSS' t={t}>
                    When you use Master CSS&#39;s enhanced syntax, it does what you&#39;d expect it to do. E.g. <code>24</code> (px).
                </Trans>
            </p>
            <Code lang="html">{`
                <h1 class="**font:24**">...</h1>
            `}</Code>
            <p>
                <Trans i18nKey='$MasterConverts' t={t}>
                    Master converts to <code>rem</code> and generates:
                </Trans>
            </p>
            <Code lang="css">{`
                .font\:24 {
                    font-size: 1.5rem
                }
            `}</Code>
            <p>
                <Trans i18nKey='$MasterOutputs' t={t}>
                    Master outputs the optimal unit/conversion accordingly. This increases productivity and reduces clutter inside <code>class=&#34;&#34;</code> attributes.
                </Trans>
            </p>
            {/* <p>
                <Trans i18nKey='$AnExample2' t={t}>
                    An example of this can be seen in the animation on our <ALink href="https://css.master.co#experience">front page</ALink>.
                </Trans>
            </p> */}
            <hr />

            <h2 id="experience-oriented-original-design">{t('Experience-oriented original design')}</h2>
            <p>
                <Trans i18nKey='$NewLanguage' t={t}>
                    &#34;But I&#39;d need to learn a new language to use Master CSS?&#34;
                </Trans>
            </p>
            <p>{t('The Master CSS enhanced syntax language is built on native CSS, similar to SASS. You can start with writing native-ish CSS, and progress towards using our enhancements and syntactic sugar gradually.')}</p>

            <h3 id="structured-syntax">{t('Structured syntax')}</h3>
            <p>
                <Trans i18nKey='$ReasonablySimplifyStyling' t={t}>
                    Our intent is not to have native CSS in <code>class=&#34;&#34;</code> attributes, but to reasonably simplify and optimize the styling of elements in an elegant manner.
                </Trans>
            </p>
            <p>
                <Trans i18nKey='$StylesFollowTheSameGrammar' t={t}>
                    All styles/rules follow the same grammar, minimizing the need to check docs. As an example, to set <code>1rem</code> you can do:
                </Trans>
            </p>
            <Code lang="html">{`
                <div class="**font-size:1rem**">${t('Similar to native CSS')}</div>
                <div class="**font:1rem**">${t('Shorthand example')}</div>
                <div class="**font:16**">${t('No unit specified implies 16px to 1rem')}</div>
                <div class="**f:16**">${t('Shortest shorthand')}</div>
            `}</Code>
            <p>
                <Trans i18nKey='$MoreExamples' t={t}>
                    Let&#39;s see more examples:
                </Trans>
            </p>
            <Code lang="html">{`
                <div class="**bg:blue-60/.5**">${t('Set a color of blue-60, with an opacity of .5')}</div>
                <div class="**scale(1.5)**">${t('Magnify to 1.5x')}</div>
                <div class="**~transform|.3s|ease**">${t('Transition with a delay of 0.3s and timing-function "ease"')}</div>
                <div class="**block**">${t('Use a semantic class that translates to "display: block"')}</div>
                ...
            `}</Code>
            <p>{t('Built-in selector syntax. Setting the background as an example:')}</p>
            <Code lang="html">{`
                <div class="**bg:pink:hover**">${t('Set a pink background on hover')}</div>
                <div class="**bg:pink~***">${t('Set a pink background for all subsequent sibling elements')}</div>
                <div class="**bg:pink+div**">${t('All subsequent div siblings')}</div>
                <div class="**bg:pink_:where(p)**">${t('All descendant p elements')}</div>
                <div class="**bg:pink:first**">${t('Use simplified :first instead of :nth-child to set pink background')}</div>
                ...
            `}</Code>
            <p>{t('Built-in media query syntax examples:')}</p>
            <Code lang="html">{`
                <div class="**width:800@>=1024**">${t('Set width to 50rem, when screen width >=1024. Arbitrary values are supported at runtime')}</div>
                <div class="**width:800@sm**">${t('Similar to previous example, using a built-in breakpoint')}</div>
                <div class="**top:1@xs&<lg**">${t('Screen width >= 600px & < 1279.98px margin-top at 0.0625rem')}</div>
                <div class="**bg:gray-20@dark**">${t('Set background to gray-20 when in dark mode')}</div>
                <div class="**hide@print**">${t('Hide element for print')}</div>
                <div class="**@fade|.2s@motion**">${t('Fade with a 0.2s delay, when low motion is not speficied by client')}</div>
                ...
            `}</Code>
            <p>
                <Trans i18nKey='$ForMore' t={t}>
                    These examples are only the tip of the iceburg. Please see our <ALink href="/docs/syntax-tutorial">Syntax Tutorial</ALink> for more.
                </Trans>
            </p>
            <h3 id="cutting-edge-technology">{t('Cutting-edge technology')}</h3>
            <p>
                <Trans i18nKey='$MorePowerfulWays' t={t}>
                    You think that&#39;s it? We&#39;ve designed even more powerful ways to optimize your code!
                </Trans>
            </p>
            {(() => {
                const code1 = /* html */ `
                            <ul class="block**>li:hover@md** p:16**>li:hover@md** w:full**>li:hover@md** text:center**>li:hover@md** font:blue/.5**>li:hover@md**"></ul>
                        `
                const code2 = /* html */ `
                            <ul class="{block;p:16;w:full;text:center;font:blue/.5}**>li:hover@md**"></ul>
                        `
                return (
                    <>
                        <h4>{t('Grouping feature ✨')}</h4>
                        <p>
                            <Trans i18nKey='$RepetitiveSelectors' t={t}>
                                We often see repetitive selectors &amp; media queries:
                            </Trans>
                        </p>
                        <Code lang="html" scrollbar={false}>{code1}</Code>
                        <p>
                            <Trans i18nKey='$GroupingFeature' t={t}>
                                Using Master&#39;s grouping feature <DroppedCode p1={code1} p2={code2} target="class" t={t} />
                            </Trans>
                        </p>
                        <Code lang="html" scrollbar={false} valid>{code2}</Code>
                    </>
                )
            })()}

            <h4>{t('Reactive Styles✨')}</h4>
            <InteractingIndicator icon="click">
                {t('Toggle the checkbox to see the target element react')}
            </InteractingIndicator>
            <div className="demo">
                <StyleAnElementBasedOnTargetStateExample />
            </div>
            <p>
                <Trans i18nKey='$PuttingStyles' t={t}>
                    &#34;Putting styles meant for a specific element on another element feels strange, and doesn&#39;t get update dynamically.&#34; For example:
                </Trans>
            </p>
            <Code lang="html">{codeOfStyleASiblingBehindExample}</Code>
            <p>
                <Trans i18nKey='$InteractingIndicator' t={t}>
                    Using Master&#39;s Reactive Styles, you can put the style on the target element instead:
                </Trans>
            </p>
            <Code lang="html" valid>{codeOfStyleAnElementBasedOnTargetStateExample}</Code>
            <p>
                <Trans i18nKey='$ToLearnMore' t={t}>
                    To learn more, check out our <ALink href="/docs/syntax-tutorial">Syntax Tutoral</ALink>.
                </Trans>
            </p>
            <h3 id="a-forerunner-to-syntax-highlighting">{t('A forerunner to syntax highlighting')}</h3>
            <p>
                <Trans i18nKey='$SyntaxHighlighted' t={t}>
                    You might have notices that in our docs <code>class=&#34;...&#34;</code> is syntax-highlighted. We can do this thanks to Master CSS&#39;s structure and its positioning as a programming language.
                </Trans>
            </p>
            <figure>
                <Image src="/images/syntax-highlight.jpg" width="750" height="260" alt="syntax highlight" className="blend:lighten@dark" />
                <figcaption><a href="https://marketplace.visualstudio.com/items?itemName=masterco.master-css-language-service" target="blank">Master CSS Language Service for Visual Studio Code</a></figcaption>
            </figure>
            <p>{t('Syntax highlighting improves your development experience:')}</p>
            <ul>
                <li>{t('Improves aesthetics of longer code in class attributes')}</li>
                <li><p>
                    <Trans i18nKey='$Improves' t={t}>
                        Improves readability, so It&#39;s easier to parse and find relevant code
                    </Trans>
                </p></li>
                <li>{t('Helps with error detection')}</li>
                <li><p>
                    <Trans i18nKey='$Study' t={t}>
                        A study by <a href="https://en.wikipedia.org/wiki/Psychology_of_programming" target="blank">PPIG</a> finds that syntax highlighting significantly helps comprehension and reduces time to internalize a language.
                    </Trans>
                </p></li>
            </ul>
            <p>
                <Trans i18nKey='$Why' t={t}>
                    Why don&#39;t other CSS frameworks/libraries have this feature? Because others don&#39;t have a structure consistent enough to support syntax-highlighting.
                </Trans>
            </p>
            <p>
                <Trans i18nKey='$Autocompletion' t={t}>
                    Master CSS also features <b>autocompletion</b> and <b>CSS preview</b>: <ALink href="/docs/developer-tools">developer tools</ALink>.
                </Trans>
            </p>
            <h3 id="framework-agnostic-and-out-of-the-box">{t('Framework-agnostic out-of-the-box')}</h3>
            <p>
                <Trans i18nKey='$FamiliarAttribute' t={t}>
                    Master CSS uses the familiar <code>class=&#34;&#34;</code> attribute, so it doesn&#39;t need additional integrations. Additionally, all the features such as selectors, media queries, breakpoints, color codes,... work out-of-the-box.
                </Trans>
            </p>
            <p>{t('With one line of code, JIT mode can be enabled for any framework/platform.')}</p>
            <Code lang="html">{`
                <script src="https://cdn.master.co/css"></script>
            `}</Code>
            <p>
                <Trans i18nKey='$HybridRendering' t={t}>
                    We officially provide JIT mode because of the portability it enables. We also provide server-side and client-side <ALink href="/docs/hybrid-rendering">hybrid rendering</ALink>, using hydration techniques. In the near future we&#39;ll be releasing full support and tools for AOT.
                </Trans>
            </p>
            <p>
                <Trans i18nKey='$SetupGuide' t={t}>
                    Even though Master CSS is framework-agnostic, we have a <ALink href="/docs/setup">setup guide</ALink> to help you get started.
                </Trans>
            </p>
            <p>
                <Trans i18nKey='$SyntaxTutorial' t={t}>
                    If you aren&#39;t yet familiar with CSS, you can get started with our <ALink href="/docs/syntax-tutorial">syntax tutorial</ALink>.
                </Trans>
            </p>

            <hr />

            <h2 id="avoiding-premature-abstraction">{t('Avoiding premature abstraction')}</h2>
            <p>{t('Writing CSS tends to involve naming things.')}</p>
            <p>
                <Trans i18nKey='$PrematureAbstration' t={t}>
                    Traditionally, naming an element first has become standard practice. Or you might be forced to do so in order to implement selectors/breakpoints. These both result from premature abstration. For example:
                </Trans>
            </p>
            <div className="demo">
                <div className="mx:auto max-w:480">
                    <ExpressiveStyles></ExpressiveStyles>
                </div>
            </div>
            <CodeTabs>{[
                {
                    name: 'home.html', lang: 'html',
                    code: `
                        <div class="card">
                            <img class="card-image" src="/images/mountain.jpg" />
                            <div class="card-body">
                                <div class="card-title">Mountain</div>
                                <div class="card-text">A mountain is an elevated portion of the Earth&#39;s crust, generally with steep sides that show significant exposed bedrock.</div>
                            </div>
                        </div>
                    `
                },
                {
                    name: 'card.css', lang: 'css', lineNumbers: true,
                    code: `
                        .card {
                            overflow: hidden;
                            border-radius: 0.625rem;
                            margin-left: auto;
                            margin-right: auto;
                            max-width: 30rem;
                            background-color: $white;
                            transition: transform 0.2s;
                        }

                        .card:hover {
                            transform: translateY(-0.3125rem);
                        }
                        
                        .card-image {
                            object-fit: cover
                        }

                        .card-title {
                            font-weight: 700;
                            font-size: 1.25rem;
                            line-height: 1.625rem;
                            color: $fade-30;
                        }

                        .card-body {
                            padding: 1.5625rem
                        }
                        
                        .card-text {
                            margin-top: 0.5rem;
                            overflow: hidden;
                            display: -webkit-box;
                            overflow-wrap: break-word;
                            text-overflow: ellipsis;
                            -webkit-box-orient: vertical;
                            -webkit-line-clamp: 3;
                            font-size: 0.875rem;
                            line-height: 1.25rem;
                            color: $fade;
                        }
                        
                        .dark .card {
                            background-color: $gray-22;
                        }
                        
                        .dark .card-text {
                            color: $gray-60
                        }
                        
                        @media (min-width:600px) {
                            .card {
                                display: flex
                            }

                            .card-image {
                                width: 9rem
                            }
                        }
                    `
                },
                // {
                //     name: 'home.css', lang: 'css', lineNumbers: true,
                //     code: `
                //         test
                //     `
                // }
            ]}</CodeTabs>
            <p>
                <Trans i18nKey='$LooksReasonable' t={t}>
                    Yes, this looks reasonable. But, aside from having to write a lot of code in <code>card.css</code>, a lot of decisions had to be made:
                </Trans>
            </p>
            <ul>
                <li>{t('What do we call this card?')}</li>
                <li>
                    <Trans i18nKey='$ClassNameBeenUsed' t={t}>
                        <code>.card</code> has this class name been used?
                    </Trans>
                </li>
                <li>
                    <Trans i18nKey='$Convention' t={t}>
                        Is there a convention being used that arrives at the name <code>.card-text</code>? Has it been accepted by everyone?
                    </Trans>
                </li>
                <li>
                    <Trans i18nKey='$CodeSharing' t={t}>
                        Do other cards use the same style? Is code-sharing working for <code>.card</code>?
                    </Trans>
                </li>
                <li>{t('If we need to make small adjustments to this card, would we need to create another name?')}</li>
                <li>{t('The styling of this card might not be reusable?')}</li>
                <li>{t('What do we call the card on the homepage? how about on other pages?')}</li>
                <li>
                    <Trans i18nKey='$Adjust' t={t}>
                        Do we adjust <code>.card</code> itself for those cards mentioned previously?
                    </Trans>
                </li>
                <li>
                    <Trans i18nKey='$Cards' t={t}>
                        There are other elements that look like <code>.card</code>, but they aren&#39;t cards!
                    </Trans>
                </li>
                <li>
                    <Trans i18nKey='$ShouldBeExtended' t={t}>
                        <code>.card</code> maybe ought be extended, its style is used it many places.
                    </Trans>
                </li>
                <li>{t('Switching back and forth between HTML and CSS')}</li>
                <li>{t('Is this really following best practices?')}</li>
            </ul>
            <p>{t('Wait, what would the rest of the team go through when maintaning this code?')}</p>
            <ul>
                <li>{t('Where is the CSS file for this card?')}</li>
                <li>{t('Is there another CSS file with rules that affect this card?')}</li>
                <li>{t("Are there media queries or selectors for this card that I don't know about?")}</li>
                <li>
                    <Trans i18nKey='$ComputedStyles' t={t}>
                        How does the computed styles of this card look? Do I need to use <code>!important</code>?
                    </Trans>
                </li>
                <li>
                    <Trans i18nKey='$Modify' t={t}>
                        If I modify this <code>.card</code>, would the modifications leak？
                    </Trans>
                </li>
                <li>{t('This card needs to be extended. Looks like we need to create another class name.')}</li>
                <li>{t("We don't need this card anymore. It should have been removed, so why is it still here?")}</li>
                <li>{t('Whoever named this card did a poor job...')}</li>
                <p>
                    <Trans i18nKey='$ShareWithUs' t={t}>
                        If you can think of other issues, please <a href="https://github.com/master-co/css/discussions/new" target="blank">share them with us</a>.
                    </Trans>
                </p>
            </ul>
            <p>{t('All these considerations were involved in a single card style. Imagine the number of considerations for an entire application.')}</p>
            <p>
                <Trans i18nKey='$ImpreciseCode' t={t}>
                    Traditional approaches lead to imprecise code, due to uncertainties & incomplete information. When styling elements, you have to speculate what the final end-product might look like. CSS priorities/specificity consequences make the process more complex and harder to predict. The project can grow out of hand,  severely affecting productivity.
                </Trans>
            </p>
            <p>{t('With Master CSS, you can apply styles on elements in a "flat" manner, avoid getting intertwined in complex CSS, and allow teammembers to ramp up more quickly.')}</p>
            <div className="demo">
                <div className="mx:auto max-w:480">
                    <ExpressiveStyles></ExpressiveStyles>
                </div>
            </div>
            <Code lang="html" name="home.html">{codeOfExpressiveStylesExample}</Code>
            <p>
                <Trans i18nKey='$UsingMasterCSS' t={t}>
                    Using Master CSS, the card&#39;s structure (HTML) and style (CSS) become concise and condensed. It&#39;s easy to add/remove styles for a given element. The more complex a style, the simpler it is to use <ALink href="/docs/syntax-tutorial">Master CSS language</ALink>, relative to other methods and tools.
                </Trans>
            </p>
            <InteractingIndicator icon="click">
                {t('Right click → Inspect → observe the resulting output')}
            </InteractingIndicator>
            <p>
                <Trans i18nKey='$Conclusion' t={t}>
                    In conclusion, Master rejects the abstraction approach of naming <code>.card</code> and then styling through it? No, we still recommend such abstractions. It&#39;s just difficult to abstract <i>well</i>, so we recommend —— A syntax-first, semantic-assist approach.
                </Trans>
            </p>
            <p>
                <Trans i18nKey='$LearnMore' t={t}>
                    To learn more about abstracting, read our official guide —— <ALink href="/docs/reusing-design">reusing design</ALink>.
                </Trans>
            </p>
            {/* 20% 的語意化寫法，80% 的原子寫法，這意味著你只有 20% 的時間會需要再檔案之間來回切換，那如果你連這 20% 的修改頻率都非常高，代表你沒有構思好共用部位及架構 */}

            <hr />

            <h2 id="scalability-reduces-css">{t('Scalability reduces CSS')}</h2>
            <figure>
                <Image src="/images/traditional-vs-master-css.svg" alt="Traditional CSS vs Master CSS" width="750" height="400" quality={100} />
                <figcaption>
                    {t("Master CSS's output size plateaus as element quantity increases")}
                </figcaption>
            </figure>
            <p>
                More to come... 🚧
            </p>

            <hr />

            <h2 id="code-portability">{t('Code portability')}</h2>
            <p>{t('Traditionally, designers have to be comfortable with working in front-end frameworks. React, Vue, Angular, et al. all have complex build environments that often become barriers.')}</p>
            <p>{t('Now with Master CSS, All of the design can be implemented in HTML or HTML-like templates. Anyone with a basic knowledge of HTML/CSS can leverage Master CSS.')}</p>
            <MasterSaid>{t('The portability is such that anyone can implement full-fledged designs through copying & pasting alone.')}</MasterSaid>
            <hr />

            <h2 id="obsessed-with-separation-of-concerns">{t('The obsession with separation of concerns')}</h2>
            <p>{t('Many folks believe that HTML and CSS should conform to the design principle of separation of concerns (SoC). We believe that applying SoC to HTML & CSS, is more a matter of cultural momentum, and over-interpretation of SoC.')}</p>
            <p>{t('JavaScript aside, web UI consists of HTML structure, and CSS for styling. CSS takes up a significant portion of time spent working on HTML and its related business logic. This implies that HTML and CSS are highly integrated and almost always used together.')}
                <Trans i18nKey='$ObsessedWithSoC' t={t}>
                    Separating the two introduces a layer of abstraction where the cost usually outweigh the benefit, leading to <a href="#avoiding-premature-abstraction">premature abstraction</a>.
                </Trans>
            </p>
            <p>
                <Trans i18nKey='$ObsessedWithSoC2' t={t}>
                    For instance when <a href="https://2021.stateofjs.com/en-US/libraries/front-end-frameworks" target="blank">the most popular frontend framework React et al.</a> introdued JSX, it was highly controversial because it was throught to be violating SoC, through mixing HTML, CSS, and JS. For details on how not adhering to SoC benefits a React environment check out <a href="https://krasimir.gitbooks.io/react-in-patterns/content/chapter-13/" target="blank">React and separation of concerns</a>.
                </Trans>
            </p>
            <p>
                <Trans i18nKey='$Ultimately' t={t}>
                    Ultimately, It&#39;s about how you structure your application and its design. JSX and similar tools may very well help to separate/mix concerns optimal to your application structure.
                </Trans>
            </p>
            <MasterSaid>{t('In frontend engineering, separation of concerns should focus on your structure, how you compartmentalize/componentize, rather than separating by language.')}</MasterSaid>

            <hr />

            <h2 id="not-a-utility-first-framework-but-a-language">{t('Not a utility-first framework, but a language')}</h2>
            <p>{t('Every library/framework has its own style of naming and constraints. Projects usually follow their own design systems. Problems occur when projects adopt the constraints and styles of a library/framework.')}</p>
            <p>More to come... 🚧</p>

            <hr />

            {/* <h2 id="in-conclusion">{t('In conclusion')}</h2> */}

            {/* <hr /> */}

            <h2 id="mainstream-frameworks-comparison">{t('Mainstream frameworks comparison')}</h2>
            <DocTable className="f:14_p overflow-x:auto {px:20;mx:-20}@<sm" noScroll>
                <thead>
                    <tr>
                        <th></th>
                        <th className="w:1/4">
                            <MasterSvg width="80" height="80" className="mx:auto" />
                            <div className="text:center my:10">Master CSS</div>
                        </th>
                        <th className="w:1/4">
                            <TailwindCSSSvg width="80" height="80" className="mx:auto" />
                            <div className="text:center my:10">Tailwind CSS</div>
                        </th>
                        <th className="w:1/4">
                            <BootstrapSvg width="80" height="80" className="mx:auto scale(.9)" />
                            <div className="text:center my:10">Bootstrap</div>
                        </th>
                    </tr>
                </thead>
                <tbody className="text:center">
                    <tr>
                        <th><p>Type</p></th>
                        <td><p>CSS Language</p></td>
                        <td><p>CSS Utility</p></td>
                        <td><p>CSS Library/Utility</p></td>
                    </tr>
                    <tr>
                        <th><p>Setup</p></th>
                        <td><p>🟢 Zero-configuration</p></td>
                        <td><p>🔴 PostCSS, Autoprefixer, Build Tools</p></td>
                        <td><p>🟢 Zero-configuration</p></td>
                    </tr>
                </tbody>
                <thead>
                    <tr>
                        <th colSpan={4} className="pt:50 f:22">Compile Mode</th>
                    </tr>
                </thead>
                <tbody className="text:center">
                    <tr>
                        <th><p>Ahead of time</p></th>
                        <td><p>🚧</p></td>
                        <td><p>🟢</p></td>
                        <td><p>🟢</p></td>
                    </tr>
                    <tr>
                        <th><p>Production at runtime</p></th>
                        <td><p>🟢</p></td>
                        <td><p>🔴</p></td>
                        <td><p>🔴</p></td>
                    </tr>
                    <tr>
                        <th><p>Server-side rendering</p></th>
                        <td><p>🟢</p></td>
                        <td><p>🔴</p></td>
                        <td><p>🔴</p></td>
                    </tr>
                    <tr>
                        <th><p>Hybrid rendering</p></th>
                        <td><p>🟢</p></td>
                        <td><p>🔴</p></td>
                        <td><p>🔴</p></td>
                    </tr>
                </tbody>
                <thead>
                    <tr>
                        <th colSpan={4} className="pt:50 f:22">Output Size</th>
                    </tr>
                </thead>
                <tbody className="text:center">
                    <tr>
                        <th><p>Fixed cost of runtime</p></th>
                        <td><p>~14KB</p></td>
                        <td><p>-</p></td>
                        <td><p>-</p></td>
                    </tr>
                    <tr>
                        <th><p>Fixed cost of static output</p></th>
                        <td><p>🟢 0KB</p></td>
                        <td><p>🟢 0KB</p></td>
                        <td><p>🔴 ~24KB</p></td>
                    </tr>
                    <tr>
                        <th><p>Source</p></th>
                        <td><p>🟢 Current page</p></td>
                        <td><p>🟠 All files</p></td>
                        <td><p>🔴 Whole lib</p></td>
                    </tr>
                </tbody>
                <thead>
                    <tr>
                        <th colSpan={4} className="pt:50 f:22">Rendering</th>
                    </tr>
                </thead>
                <tbody className="text:center">
                    <tr>
                        <th><p>Render-blocking resources</p></th>
                        <td><p>🟢 Internal CSS</p></td>
                        <td><p>🔴 External CSS</p></td>
                        <td><p>🔴 External CSS</p></td>
                    </tr>
                    <tr>
                        <th><p>First contentful paint</p></th>
                        <td><p>🟢 Fastest</p></td>
                        <td><p>Fast</p></td>
                        <td><p>🟠 Normal</p></td>
                    </tr>
                </tbody>
                <thead>
                    <tr>
                        <th colSpan={4} className="pt:50 f:22">Loading</th>
                    </tr>
                </thead>
                <tbody className="text:center">
                    <tr>
                        <th><p>Page-loaded CSS size</p></th>
                        <td><p>🟢 Smallest</p></td>
                        <td><p>🟠 Large</p></td>
                        <td><p>🔴 Largest</p></td>
                    </tr>
                    <tr>
                        <th><p>Cache target</p></th>
                        <td><p>HTML file</p></td>
                        <td><p>CSS file</p></td>
                        <td><p>CSS file</p></td>
                    </tr>
                </tbody>
                <thead>
                    <tr>
                        <th colSpan={4} className="pt:50 f:22">Developer Tools</th>
                    </tr>
                </thead>
                <tbody className="text:center">
                    <tr>
                        <th><p>Code-completion</p></th>
                        <td><p>🟢</p></td>
                        <td><p>🟢</p></td>
                        <td><p>🔴</p></td>
                    </tr>
                    <tr>
                        <th><p>Syntax highlighting for class names</p></th>
                        <td><p>🟢</p></td>
                        <td><p>🔴</p></td>
                        <td><p>🔴</p></td>
                    </tr>
                    <tr>
                        <th><p>CSS generate preview</p></th>
                        <td><p>🟢</p></td>
                        <td><p>🟢</p></td>
                        <td><p>🔴</p></td>
                    </tr>
                    <tr>
                        <th><p>Linting</p></th>
                        <td><p>🚧</p></td>
                        <td><p>🟢</p></td>
                        <td><p>🔴</p></td>
                    </tr>
                </tbody>
            </DocTable>
            <p>
                More to come... 🚧
            </p>

            <h2 id="faqs">{t('FAQs')}</h2>
            <p>
                <Trans i18nKey='$Issues' t={t}>
                    We&#39;ve collected common questions and concerns about Master CSS. If you have other questions, issues, or suggestions, you can go to our <a href="https://discord.gg/sZNKpAAAw6">Discord channel</a> or <a href="https://github.com/master-co/css/discussions">Discussions</a>.
                </Trans>
            </p>
            <h3 id="why-not-just-write-inline-styles">{t('Why not just write inline styles?')}</h3>
            <p>
                <Trans i18nKey='$Enhanced' t={t}>
                    I want the button to be bigger at viewport width <code>&gt;=1024px</code> and then fade when disabled.
                </Trans>
            </p>
            {(() => {
                const code1 = /* html */ `
                    <button style="font-size: .875rem; text-align: center; height: 2.5rem;" disabled>${t('Oops...')}</button>
                `
                const code2 = /* html */ `
                    <button class="font:14 text:center height:40 height:56**@md** opacity:.5**[disabled]**" disabled>${t('Yeah!')}</button>
                `
                return (
                    <>
                        <Code lang="html" scrollbar={false} invalid>{code1}</Code>
                        <p className='max-w:750'>{t("Inline styles cannot apply selectors, media queries, and many CSS features. With Master CSS, you can now implement them with the most succinct syntax.")}</p>
                        <Code lang="html" scrollbar={false} valid>{code2}</Code>
                    </>
                )
            })()}
        </>
    )
}

const localeNamespace = 'docs.css.why'

Why.page = {
    layout: CssDoc,
    title: 'Build your design with a whole new CSS language instead of utilities/libraries.',
    description: 'This article goes through the concepts behind Master CSS, and demonstrate our solutions to common issues.',
    subtitle: 'Concepts and Principles',
    editors: ['Aron', 'Monting'],
    localeNamespace,
    type: 'article'
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
