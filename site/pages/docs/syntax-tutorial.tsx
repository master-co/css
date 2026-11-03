import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Image from 'next/image';
import Code from '~/components/Code';
import DocTable from '~/components/DocTable';
import DroppedCode from '~/components/DroppedCode';
import InteractingIndicator from '~/components/InteractingIndicator';
import Link from '~/components/Link';

import HoverActiveAndFocus from '~/examples/docs/syntax/HoverActiveAndFocus.tsx?clearCodeTokens';
import codeOfHoverActiveAndFocusExample from '~/examples/docs/syntax/HoverActiveAndFocus.tsx?react2markup';

import FirstLastAndNthExample from '~/examples/docs/syntax/FirstLastAndNth.tsx?clearCodeTokens';
import codeOfFirstLastAndNthExample from '~/examples/docs/syntax/FirstLastAndNth.tsx?react2markup';

import FormValidationAndStatesExample from '~/examples/docs/syntax/FormValidationAndStates.tsx?clearCodeTokens';
import codeOfFormValidationAndStatesExample from '~/examples/docs/syntax/FormValidationAndStates.tsx?react2markup';

import BeforeAndAfterExample from '~/examples/docs/syntax/BeforeAndAfter.tsx?clearCodeTokens';
import codeOfBeforeAndAfterExample from '~/examples/docs/syntax/BeforeAndAfter.tsx?react2markup';

import PlaceholderAndSelectionExample from '~/examples/docs/syntax/PlaceholderAndSelection.tsx?clearCodeTokens';
import codeOfPlaceholderAndSelectionExample from '~/examples/docs/syntax/PlaceholderAndSelection.tsx?react2markup';

import ScrollbarExample from '~/examples/docs/syntax/Scrollbar.tsx?clearCodeTokens';
import codeOfScrollbarExample from '~/examples/docs/syntax/Scrollbar.tsx?react2markup';

import ApplyStylesOnActiveExample from '~/examples/docs/syntax/ApplyStylesOnActive.tsx?clearCodeTokens';
import codeOfApplyStylesOnActiveExamplee from '~/examples/docs/syntax/ApplyStylesOnActive.tsx?react2markup';

import ApplyStylesOnOpenExample from '~/examples/docs/syntax/ApplyStylesOnOpen.tsx?clearCodeTokens';
import codeOfApplyStylesOnOpenExamplee from '~/examples/docs/syntax/ApplyStylesOnOpen.tsx?react2markup';

import StyleAllDescendantsAtOnceExample from '~/examples/docs/syntax/StyleAllDescendantsAtOnce.tsx?clearCodeTokens';
import codeOfStyleAllDescendantsAtOnceExample from '~/examples/docs/syntax/StyleAllDescendantsAtOnce.tsx?react2markup';

import StyleTheFollowingChildrenExample from '~/examples/docs/syntax/StyleTheFollowingChildren.tsx?clearCodeTokens';
import codeOfStyleTheFollowingChildrenExample from '~/examples/docs/syntax/StyleTheFollowingChildren.tsx?react2markup';

import StyleASiblingBehindExample from '~/examples/docs/syntax/StyleASiblingBehind.tsx?clearCodeTokens';
import codeOfStyleASiblingBehindExample from '~/examples/docs/syntax/StyleASiblingBehind.tsx?react2markup';

import StyleAllSiblingsBehindExample from '~/examples/docs/syntax/StyleAllSiblingsBehind.tsx?clearCodeTokens';
import codeOfStyleAllSiblingsBehindExample from '~/examples/docs/syntax/StyleAllSiblingsBehind.tsx?react2markup';

import StyleAnElementBasedOnTargetStateExample from '~/examples/docs/syntax/StyleAnElementBasedOnTargetState.tsx?clearCodeTokens';
import codeOfStyleAnElementBasedOnTargetStateExample from '~/examples/docs/syntax/StyleAnElementBasedOnTargetState.tsx?react2markup';

import StyleAnElementBasedOnTargetState2Example from '~/examples/docs/syntax/StyleAnElementBasedOnTargetState2.tsx?clearCodeTokens';
import codeOfStyleAnElementBasedOnTargetState2Example from '~/examples/docs/syntax/StyleAnElementBasedOnTargetState2.tsx?react2markup';

import DarkModeAndColorSchemesExample from '~/examples/docs/syntax/DarkModeAndColorSchemes.tsx?clearCodeTokens';
import codeOfDarkModeAndColorSchemesExample from '~/examples/docs/syntax/DarkModeAndColorSchemes.tsx?react2markup';

import codeOfResponsiveGrids from '~/pages/examples/responsive-grids.tsx?react2markup';

import codeOfViewportOrientation from '~/pages/examples/viewport-orientation.tsx?react2markup';

import MotionPreferenceExample from '~/examples/docs/syntax/MotionPreference.tsx?clearCodeTokens';
import codeOfMotionPreferenceExample from '~/examples/docs/syntax/MotionPreference.tsx?react2markup';


import CssDoc from '~/layouts/CssDoc'
import IFrame from '~/components/IFrame';
import { toggleTheme } from '~/utils/toggleTheme';
import { useRef, useState } from 'react';
import { markResponsiveTokens } from '~/utils/markResponsiveTokens';

export default function Syntax({ t }: any) {

    const codeOfResponsiveGridsState = useState(codeOfResponsiveGrids);

    return (
        <>
            <p>
                A complete tutorial and feature overview of <b>style variants</b>, <b>states</b>, <b>selectors</b>, <b>media queries</b> and <b>use cases</b> for Master CSS syntax.
            </p>
            <h2 id="introduction">Introduction</h2>
            <p>
                To help you shorten and speed up your code output in an intuitive way, we&#39;ve designed a structured syntax close to native CSS.
            </p>
            <h3 id="composability-of-styles">Composability of styles</h3>
            <p>
                Compose styles like Lego without the burden of naming, instead of constraining the flexibility of styles through abstract class names at the outset.
            </p>
            <div className="demo p:0 f:0">
                <div className="rel">
                    <Image src="/images/landscape-mobile-screen.png" className="untouchable" width="480" height="319" quality={100} alt='hello world' />
                    <h1 className="abs inset:0 m:auto height:fit text:center font:7vw font:40@xs font:heavy font:white blend:overlay @flash|3s|infinite">
                        Hello, World!
                    </h1>
                </div>
            </div>
            <Code lang="html">{`
                <div class="**rel**">
                    <img class="**aspect:480/319** **untouchable**" src="/images/landscape-mobile-screen.png" alt='hello world' />
                    <h1 class="**abs** **blend:overlay** **text:center** **font:7vw** **font:40@xs** **font:heavy** **font:white** **inset:0** **m:auto** **h:fit** **@flash|3s|infinite** ">
                        Hello, World!
                    </h1>
                </div>
            `}</Code>
            <h3 id="multi-state-style-variants">Multi-state style variants</h3>
            <p>
                All styles and properties in Master support selectors and media queries. You can specify multiple conditions and states at the same time.
            </p>
            <Code lang="html">{`
                <div class="bg:gray-90**:hover@dark@md** hidden@print left:16@sm&<md">...</div>
            `}</Code>
            <p>
                Attaching states is like making a sentence.
            </p>
            <blockquote>
                <p>Fill the <u>button</u> <u>background</u> with <u>blue</u> on <u>hover</u> at <u>viewport width <code>&gt;=1024px</code></u>.</p>
            </blockquote>
            <p>
                After keeping only the underlined parts:
            </p>
            <blockquote>
                <p><u>button</u> <u>bg</u> <u>blue</u> <u>hover</u> <u>viewport width <code>&gt;=1024px</code></u></p>
            </blockquote>
            <p>
                Transform above to HTML sequentially:
            </p>
            <blockquote>
                <p>
                    <Code lang="html" inline>{`<**button** class="bg:blue:hover@md"></button>`}</Code>
                </p>
            </blockquote>
            <p>
                and auto-generated CSS looks like:
            </p>
            <Code lang="css">{`
                **@media (min-width:1024px)** {
                    .bg\\:blue\\:hover\\@md**:hover** {
                        background-color: #175fe9
                    }
                }
            `}</Code>
            <p>
                That&#39;s it. You have almost learned how to use Master CSS!
            </p>
            <h2 id="basic-usage">Basic usage</h2>
            <p>To let you rapidly style elements with <b>semantics</b>, <b>shorthands</b>, <b>acronyms</b>, <b>symbols</b>, and even <b>group styles</b>, we&#39;ve created a succinct and near-native syntax.</p>
            <h3 id="add-semantic-styles">Semantic styles</h3>
            <p>We&#39;ve carefully crafted semantics for some properties and styles. It&#39;s not our intention to let you write CSS directly, but you can still do so.</p>
            {(() => {
                const code1 = /* html */ `<p class="**text-transform:capitalize** **position:absolute** **display:block** **border-radius:50%**">...</p>`
                const code2 = /* html */ `<p class="**capitalize** **abs** **block** **round**">...</p>`
                return (
                    <>
                        <Code lang="html">{code1}</Code>
                        <p>Try using the built-in semantic classes. We&#39;ve covered the naming cost for you. <DroppedCode p1={code1} p2={code2} t={t} target="class" /></p>
                        <Code lang="html">{code2}</Code>
                    </>
                )
            })()}
            <p>
                When a native CSS rule&#39;s value alone <b>sufficiently expresses its modification</b>, we make that value available as a semantic class.
            </p>
            <p>
                E.g., we do <code>display:block -&gt; block</code> but don&#39;t do <code>font-weight:lighter -&gt; lighter</code>, since it&#39;s not explicit that the class applies to <code>font-weight</code>.
            </p>
            <p>
                In this way, markup complexity is reduced and readability is improved, while preserving semantics.
            </p>
            <h3 id="add-acronym-styles">Acronym styles</h3>
            <p>For some styles we provide acronym syntax. Writing in native CSS looks like:</p>
            {(() => {
                const code1 = /* html */ `<p class="**font-size:1rem** **z-index:100** **order:2**">...</p>`
                const code2 = /* html */ `<p class="**f:16** **z:100** **o:2**">...</p>`
                return (
                    <>
                        <Code lang="html">{code1}</Code>
                        <p>Try using acronyms. ( <code>1rem</code> = <code>16</code> ) <DroppedCode p1={code1} p2={code2} t={t} target="class" /></p>
                        <Code lang="html">{code2}</Code>
                    </>
                )
            })()}
            <h3 id="add-css-shorthand-properties">CSS shorthand properties</h3>
            <p>Using no shorthand, <code>padding</code> and <code>border</code> would look like this:</p>
            {(() => {
                const code1 = /* html */ `<p class="**padding-top:1rem** **padding-bottom:1rem** **padding-left:2rem** **padding-right:2rem** **border-width:.0625rem** **border-color:red** **border-style:solid**">...</p>`
                const code2 = /* html */ `<p class="**padding:16|32** **border:1|solid|red**">...</p>`
                const code3 = /* html */ `<p class="**p:16|32** **b:1|solid|red**">...</p>`
                return (
                    <>
                        <Code lang="html">{code1}</Code>
                        <p>Try using CSS shorthand. <DroppedCode p1={code1} p2={code2} t={t} target="class" /></p>
                        <Code lang="html">{code2}</Code>
                        <p>Or use CSS shorthand with acronyms. <DroppedCode p1={code1} p2={code3} t={t} target="class" /></p>
                        <Code lang="html">{code3}</Code>
                    </>
                )
            })()}
            <DocTable>
                <thead>
                    <tr>
                        <th>{t('Symbol')}</th>
                        <th>{t('Design Concept')}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>|</code></td>
                        <td><p>Use the delimiter <code>|</code> to proxy spaces between native CSS property values. Make each value have a separate meaning.</p></td>
                    </tr>
                </tbody>
            </DocTable>
            <p>
                To keep the delimiter visually unobtrusive, our syntax highlighting make it the color of comments ── gray.
            </p>
            {/* <Image src="/images/delimiter-syntax.jpg" width="324" height="33" alt="delimiter syntax highlighting" /> */}
            <h3 id="add-shorthand-styles">Shorthand styles</h3>
            <p>
                Some shorthands in Master might be ambigious. In this situation we cross-reference the property value and names to find the appropriate style to use.
            </p>
            <p>
                Some examples to clarify how this works. Starting from native CSS:
            </p>
            {(() => {
                const code1 = /* html */ `<p class="filter:blur(20) border-color:#101 font-size:32 font-weight:bold"></p>`
                const code2 = /* html */ `<p class="**blur(20)** **border:#101** **font:32** **font:bold**">...</p>`
                return (
                    <>
                        <Code lang="html">{code1}</Code>
                        <p>Try using shorthand. <DroppedCode p1={code1} p2={code2} t={t} target="class" /></p>
                        <Code lang="html">{code2}</Code>
                    </>
                )
            })()}
            <p>Through the above evolution, you can observe:</p>
            <ul>
                <li>Omitting <code>filter:</code> and just typing <code>blur(20)</code> still maps correctly to the <code>filter</code> property.</li>
                <li>Omitting <code>-color</code> and just typing <code>border:#101</code> still maps correctly to the <code>border-color</code> property.</li>
                <li>Omitting <code>-size</code> and just typing <code>font:32</code> still maps correctly to the <code>font-size</code> property.</li>
                <li>Omitting <code>-weight</code> and just typing <code>font:bold</code> still maps correctly to the <code>font-weight</code> property.</li>
            </ul>
            <p>
                For other style shorthands, see their respective documentation.
            </p>
            <h3 id="add-symbolic-styles">Symbolic styles</h3>
            <p>Of all styles, only <code>animation</code> and <code>transition</code> can be represented by symbols. The native(ish) CSS would look like:</p>
            {(() => {
                const code1 = /* html */ `<p class="animation:fade|1s|ease transition:opacity|3s"></p>`
                const code2 = /* html */ `<p class="**@**fade|1s|ease **~**opacity|3s">...</p>`
                return (
                    <>
                        <Code lang="html">{code1}</Code>
                        <p>Try using symbols to make them elegant. <DroppedCode p1={code1} p2={code2} t={t} target="class" /></p>
                        <Code lang="html">{code2}</Code>
                    </>
                )
            })()}
            <DocTable>
                <thead>
                    <tr>
                        <th>{t('Symbol')}</th>
                        <th>{t('Design Concept')}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>@</code></td>
                        <td><p>Wouldn&#39;t it makes sense to evolve from <code>@keyframes fade {'{ ... }'}</code> to <code>@fade</code>?</p></td>
                    </tr>
                    <tr>
                        <td><code>~</code></td>
                        <td><p>Doesn&#39;t the curve of the <code>~</code> symbol seems to imply a transition?</p></td>
                    </tr>
                </tbody>
            </DocTable>
            <h3 id="add-styles-with-units">Styles with units</h3>
            <p>For units or numerical styles, we provide <b>practical default units and conversion behaviors</b> according to their characteristics.</p>
            <p>For native CSS such as:</p>
            {(() => {
                const code1 = /* html */ `<p class="font-size:**3rem** transform:rotate(**30deg**)">...</p>`
                const code2 = /* html */ `<p class="font-size:**48** transform:rotate(**30**)">...</p>`
                const code3 = /* html */ `<p class="**font:48** **rotate(30)**">...</p>`
                return (
                    <>
                        <Code lang="html">{code1}</Code>
                        <p>Let&#39;s convert and preset the units for you. <DroppedCode p1={code1} p2={code2} t={t} target="class" /></p>
                        <Code lang="html">{code2}</Code>
                        <p>Try using shorthand to simplify further. <DroppedCode p1={code1} p2={code3} t={t} target="class" /></p>
                        <Code lang="html">{code3}</Code>
                    </>
                )
            })()}
            <p>
                In the above example, the font size <b>has no specified unit so it is determined as a pixel value and converted to rem</b> for you; the <code>rotate()</code> value is automatically preset to <code>deg</code>.
            </p>
            <h3 id="add-styles-with-colors">Styles with colors</h3>
            <p>
                Some styles like <code>color</code>, <code>fill</code>, <code>background-color</code>, etc. are colorable, the preset will match our color system.
            </p>
            <p>
                Up to 48 brightness levels are available for each color, with ranges of 2, 4, 6 ... 98.
            </p>
            <Code lang="html">{/* html */`<p class="color:**blue-60**">Use the tint 60 of blue</p>`}</Code>
            <p>
                To alter the opacity of the color with arbitrary numbers or decimals.
            </p>
            <Code lang="html">{/* html */`<p class="fill:**pink/.5**">Use the tint 50 of pink with opacity 50%</p>`}</Code>
            <p>
                Supports the HEX arbitrary value format.
            </p>
            <Code lang="html">{/* html */`<p class="bg:**#121**">Use arbitrary hex color codes</p>`}</Code>
            <p>
                Apply color functions such as <code>rgb</code>, <code>rgba</code>, <code>hsl</code>, <code>hsla</code>, etc.
            </p>
            <Code lang="html">{/* html */`<p class="b:**rgb(100,150,200)**">Use CSS color functions</p>`}</Code>
            <p>
                You can observe that the above example can apply native CSS APIs such as <code>opacity</code>, <code>#hex</code>, <code>rgb()</code> and even <code>hsl()</code> in addition to our colors.
            </p>
            <p>
                <b>Each color is provided with fifty tints.</b> This is one of our key features. In most cases, you will never need to adjust the colors yourself.
            </p>
            <h3 id="make-styles-important">Make styles !important</h3>
            <p>Add a <code className="f:gold-70@dark f:gold-60">!</code> suffix to the value.</p>
            <Code lang="html">{/* html */`
                <p class="--hide-- block! text:underline!@sm font:cyan-30!:hover">...</p>
            `}</Code>
            <h3 id="add-arbitrary-css-properties">Arbitrary CSS properties</h3>
            <p>Our built-in optimized <b>CSS property coverage has surpassed all other CSS frameworks</b>. </p>
            <p>In addition, we proviode syntax for arbitrary properties, allowing you to use some non-standard or not yet supported CSS properties on demand.</p>
            <Code lang="html">{/* html */`
                <p class="{block-size:5rem}">...</p>
            `}</Code>
            <p>
                Why use <code>{'{}'}</code>? Read on.
            </p>
            <h3 id="group-styles">Group styles ✨</h3>
            <p>The <b>Group</b> is one of our key features since <code>^1.15.0</code>. It helps you to group styles with the <b>same suffixes of selectors, media queries, etc.</b>, preventing class names from growing in length and quantity.</p>
            <p>Without grouping, your code would look like:</p>
            {(() => {
                const code1 = /* html */ `<ul class="block**>li:hover@md** width:fit**>li:hover@md** text:center**>li:hover@md** font:24**>li:hover@md** font:blue/.5**>li:hover@md**"></ul>`
                const code2 = /* html */ `<ul class="{block;width:fit;text:center;font:24;font:blue/.5}**>li:hover@md**"></ul>`
                return (
                    <>
                        <Code lang="html">{code1}</Code>
                        <p>Now group. <DroppedCode p1={code1} p2={code2} t={t} target="class" /></p>
                        <Code lang="html">{code2}</Code>
                    </>
                )
            })()}
            <DocTable>
                <thead>
                    <tr>
                        <th>{t('Symbol')}</th>
                        <th>{t('Design Concept')}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>{'{}'}</code></td>
                        <td><p>{t('Use the same curly braces as native to group properties and styles into one CSS rule.')}</p></td>
                    </tr>
                    <tr>
                        <td><code>{';'}</code></td>
                        <td><p>{t('Use the same semicolon as native to separate properties and styles.')}</p></td>
                    </tr>
                </tbody>
            </DocTable>
            <p>
                If you care about output sizes, you have to consider whether the target styles you&#39;re grouping are highly reused elsewhere. If this is the case, the final CSS rule size will be slightly higher.
            </p>
            <p>
                We recommend that you prioritize the development experience, as the differences won&#39;t be significant and you can optimize them later.
            </p>
            <h2 id="pseudo-classes">{t('Pseudo-classes')}</h2>
            <h3 id="hover-active-and-focus">{t('Hover, active, and focus')}</h3>
            <InteractingIndicator>
                Try clicking the button to see states change
            </InteractingIndicator>
            <div className="demo">
                <HoverActiveAndFocus />
            </div>
            <Code lang="html">{codeOfHoverActiveAndFocusExample}</Code>
            <h3 id="first-last-and-nth">{t('First, last, and Nth')}</h3>
            <p>
                Select and style elements using <code>:first</code>, <code>:last</code>, <code>:odd</code>, <code>:even</code>, and <code>:nth(N)</code> shorthands.
            </p>
            <div className="demo p:0 flex">
                <FirstLastAndNthExample />
            </div>
            <Code lang="tsx">{codeOfFirstLastAndNthExample}</Code>
            <p>
                For more details and a complete list, check out the <Link href="/docs/selectors">Selector Reference</Link>.
            </p>
            <h3 id="form-validations-and-states">{t('Form validations and states')}</h3>
            <p>
                Select and style form elements using <code>:disabled</code>, <code>:invalid</code>, <code>:required</code>, etc.
            </p>
            <div className="demo">
                <div className='w:300'>
                    <FormValidationAndStatesExample />
                </div>
            </div>
            <Code lang="tsx">{codeOfFormValidationAndStatesExample}</Code>
            <p>
                For more details and a complete list, check out the <Link href="/docs/selectors">Selector Reference</Link>.
            </p>
            <h2 id="pseudo-elements">{t('Pseudo-elements')}</h2>
            <h3 id="before-and-after">{t('Before and after')}</h3>
            <p>
                Attach pseudo-elements to an element using <code>:before</code> and <code>:after</code>.
            </p>
            <div className="demo">
                <BeforeAndAfterExample />
            </div>
            <Code lang="tsx">{codeOfBeforeAndAfterExample}</Code>
            <p>
                For more details and a complete list, check out the <Link href="/docs/selectors">Selector Reference</Link>.
            </p>
            <h3 id="placeholder-and-text-selection">{t('Placeholder and text selection')}</h3>
            <p>
                Change the placeholder and selection color of elements using <code>::placeholder</code> and <code>::selection</code>.
            </p>
            <InteractingIndicator icon="click">
                Try selecting the text of div
            </InteractingIndicator>
            <div className="demo">
                <div className='w:300'>
                    <PlaceholderAndSelectionExample />
                </div>
            </div>
            <Code lang="tsx">{codeOfPlaceholderAndSelectionExample}</Code>
            <p>
                For more details and a complete list, check out the <Link href="/docs/selectors">Selector Reference</Link>.
            </p>
            <h3 id="beautify-your-scrollbar">{t('Beautify your scrollbar')}</h3>
            <p>
                Style the scrollbar of an element using <code>::scrollbar</code>, <code>::scrollbar-thumb</code>, <code>::scrollbar-track</code>, <code>::scrollbar-button</code>, <code>::scrollbar-corner</code> and <code>::scrollbar-track-piece</code> shorthand.
                We&#39;ve automatically prefix them with <code>-webkit-</code> for you.
            </p>
            <InteractingIndicator>
                Try scrolling horizontally and interact with the scroll bar.
            </InteractingIndicator>
            <div className="demo p:0">
                <ScrollbarExample />
            </div>
            <Code lang="tsx">{codeOfScrollbarExample}</Code>
            <p>
                For more details and a complete list, check out the <Link href="/docs/selectors">Selector Reference</Link>.
            </p>
            <h2 id="state-selectors">{t('State selectors')}</h2>
            <h3 id="apply-styles-based-on-active">{t('Apply styles on .active')}</h3>
            <p>Style elements based on <code>.active</code>, <code>.disabled</code> and other custom class states.</p>
            <div className="demo background-image:none!">
                <ApplyStylesOnActiveExample />
            </div>
            <Code lang="tsx">{codeOfApplyStylesOnActiveExamplee}</Code>
            <p>
                For more details and a complete list, check out the <Link href="/docs/selectors">Selector Reference</Link>.
            </p>
            <h3 id="apply-styles-based-on-open">{t('Apply styles on [open]')}</h3>
            <p>Style elements based on <code>[open]</code>, <code>[type=date]</code> and other custom attribute states.</p>
            <InteractingIndicator>
                Try toggling the disclosure widget to see styles change
            </InteractingIndicator>
            <div className="demo">
                <ApplyStylesOnOpenExample />
            </div>
            <Code lang="tsx">{codeOfApplyStylesOnOpenExamplee}</Code>
            <p>
                For more details and a complete list, check out the <Link href="/docs/selectors">Selector Reference</Link>.
            </p>

            <h2 id="relationship-selectors">{t('Relationship selectors')}</h2>
            <h3 id="style-all-descendants-at-once">{t('Style all descendants at once')}</h3>
            <p>Deeply style all descendant elements/nodes at once. This is useful for typography, de-duplication styles, and dynamic content, etc.</p>
            <div className="demo py:0">
                <StyleAllDescendantsAtOnceExample />
            </div>
            <Code lang="tsx">{codeOfStyleAllDescendantsAtOnceExample}</Code>
            <p>
                Selecting the style of descendant elements and presetting the style with  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/:where" target="blank"><code>:where()</code></a> CSS pseudo-class reduces the priority of selected descendants. This can  solve specificity issues, such as subsequent styling of child elements/nodes must rely on <code>!important</code> .
            </p>
            <DocTable>
                <thead>
                    <tr>
                        <th>{t('Symbol')}</th>
                        <th>{t('Design Concept')}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>_</code></td>
                        <td><p>Using underscore <code>_</code> to proxy spaces in native CSS descendant selectors. The word &#34;under&#34; in &#34;underscore&#34; can be interpreted to imply the selecting of elements/nodes <b>under</b> the target.</p></td>
                    </tr>
                </tbody>
            </DocTable>
            <p>
                For more details and a complete list, check out the <Link href="/docs/selectors">Selector Reference</Link>.
            </p>

            <h3 id="style-the-following-children">{t('Style the following children')}</h3>
            <p>Only style the next-level child elements.</p>
            <div className="demo py:0">
                <StyleTheFollowingChildrenExample />
            </div>
            <Code lang="tsx">{codeOfStyleTheFollowingChildrenExample}</Code>
            <p>
                For more details and a complete list, check out the <Link href="/docs/selectors">Selector Reference</Link>.
            </p>

            <h3 id="style-a-sibling-behind">{t('Style a sibling behind')}</h3>
            <p>Use <code>+</code> to style an element after a specific element.</p>
            <InteractingIndicator>
                Try toggling the checkbox to see element changes behind
            </InteractingIndicator>
            <div className="demo">
                <StyleASiblingBehindExample />
            </div>
            <Code lang="tsx">{codeOfStyleASiblingBehindExample}</Code>
            <p>
                For more details and a complete list, check out the <Link href="/docs/selectors">Selector Reference</Link>.
            </p>

            <h3 id="style-all-siblings-behind">{t('Style all siblings behind')}</h3>
            <p>Use <code>~</code> to style all elements after a specific element.</p>
            <InteractingIndicator icon="observe">
                All fruit behind the apple are shrunk
            </InteractingIndicator>
            <div className="demo p:0">
                <StyleAllSiblingsBehindExample />
            </div>
            <Code lang="tsx">{codeOfStyleAllSiblingsBehindExample}</Code>
            <p>
                For more details and a complete list, check out the <Link href="/docs/selectors">Selector Reference</Link>.
            </p>

            <h3 id="style-an-element-based-on-target-state">Style an element based on target state</h3>
            <p><b>Reactive Styles</b> is one of our key features. You can style not only based on parent state but also sibling state, when it is more sensible to attach styles to the reactive target itself.</p>
            <InteractingIndicator icon="click">
                Toggle the checkbox to see the target element react
            </InteractingIndicator>
            <div className="demo">
                <StyleAnElementBasedOnTargetStateExample />
            </div>
            <Code lang="html">{codeOfStyleAnElementBasedOnTargetStateExample}</Code>
            <p>Here is another example based on parent state.</p>
            <InteractingIndicator>
                Try toggling the disclosure widget to see descendants reaction
            </InteractingIndicator>
            <div className="demo">
                <StyleAnElementBasedOnTargetState2Example />
            </div>
            <Code lang="html">{codeOfStyleAnElementBasedOnTargetState2Example}</Code>

            <h2 id="media-queries">{t('Media queries')}</h2>
            <h3 id="responsive-grids">{t('Responsive breakpoints')}</h3>
            <p>Style elements using specific breakpoints. In addition to the preset ten breakpoints <code>@3xs~@4xl</code>, you can also specify arbitrary ranges through comparison operators. E.g. <code>text:center@&lt;1234</code> or <code>hide@768&amp;&lt;1024</code>.</p>
            <InteractingIndicator icon="click">
                try resizing the window to see the grid columns below change
            </InteractingIndicator>
            <IFrame className="h:306" src="/examples/responsive-grids"
                onResize={(width: number) => {
                    markResponsiveTokens(codeOfResponsiveGridsState, codeOfResponsiveGrids, width, ['grid-cols:[0-9]+']);
                }}
            />
            <Code lang="tsx" lineNumbers>{codeOfResponsiveGridsState[0]}</Code>

            <h3 id="dark-mode-and-color-schemes">{t('Dark mode and color schemes')}</h3>
            <p>Use <code>@light</code>, <code>@dark</code> to style elements for different themes.</p>
            <InteractingIndicator icon="click">
                <a onClick={toggleTheme}>click me to toggle theme and see styles change</a>
            </InteractingIndicator>
            <div className="demo">
                <DarkModeAndColorSchemesExample />
            </div>
            <Code lang="tsx" lineNumbers>{codeOfDarkModeAndColorSchemesExample}</Code>

            <h3 id="print-format">{t('Print format')}</h3>
            <p>Use <code>@print</code> to style an element in print mode.</p>
            <InteractingIndicator icon="click">
                <a onClick={() => window.print()}>click me to see typography with `header`, `aside` hidden in print mode</a>
            </InteractingIndicator>
            <Code lang="tsx" lineNumbers>{`
                <header class="hide**@print**">...</header>
                <aside class="hide**@print**">...</aside>
                <main>...</main>
                <aside class="hide**@print**">...</aside>
            `}</Code>

            <h3 id="viewport-orientation">{t('Viewport orientation')}</h3>
            <p>Use <code>@landscape</code> / <code>@portrait</code> to style an element based on a specific orientation.</p>
            <InteractingIndicator>
                try shrinking the window to see image aspect ratio change
            </InteractingIndicator>
            <IFrame className="h:300" src="/examples/viewport-orientation" />
            <Code lang="tsx" lineNumbers>{codeOfViewportOrientation}</Code>

            <h3 id="motion-preference">{t('Motion preference')}</h3>
            <p>Use <code>@motion</code> / <code>@reduced-motion</code> to style an element based on user specific motion preferences.</p>
            <InteractingIndicator>
                try using your dev tools to emulate <code>prefers-reduced-motion: reduce</code>
            </InteractingIndicator>
            <div className="demo">
                <MotionPreferenceExample />
            </div>
            <Code lang="tsx" lineNumbers>{codeOfMotionPreferenceExample}</Code>

            <h3 id="arbitrary-media-queries">{t('Arbitrary media queries')}</h3>
            <p>In Master, we provide shorthands for most commonly used media queries, but you can also enter any media query you want.</p>
            <Code lang="html" lineNumbers>{`
                <button class="bg:blue:hover**@media(any-hover:hover)**"></button>
            `}</Code>
        </>
    )
}

const localeNamespace = 'docs.css.syntax'

Syntax.page = {
    layout: CssDoc,
    title: 'An enhanced and structured CSS syntax for class names.',
    description: 'A complete tutorial and feature overview of style variants, states, selectors, media queries and use cases for Master CSS syntax.',
    subtitle: 'Getting Started',
    cover: 'syntax.jpg',
    editors: ['Aron'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
