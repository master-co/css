import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import CodeHTML2CSS from '~/components/Code/CodeHTML2CSS'
import ReferenceTable from '~/components/Css/ReferenceTable'
import CssDoc from '~/layouts/CssDoc'

export default function Selectors() {

    return (
        <>
            <p>
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors" target="blank">CSS selectors</a> define the elements to which a set of CSS rules apply.
            </p>
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="universal-selector">Universal selector</h3>
            {/* https://developer.mozilla.org/en-US/docs/Web/CSS/Universal_selectors */}
            <p>
                Selects all elements.
                The CSS universal selector <code>*</code> matches elements of any type.
            </p>
            <CodeHTML2CSS>{`
                <body class="box:border_*****">...</body>
            `}</CodeHTML2CSS>

            <h3 id="class-selector">Class selector</h3>
            {/* https://developer.mozilla.org/en-US/docs/Web/CSS/Class_selectors */}
            <p>
                Selects all elements that have the given <code>class</code> attribute.
            </p>
            <CodeHTML2CSS>{`
                <div class="text:center**.class**">...</div>
            `}</CodeHTML2CSS>
            <h3 id="id-selector">ID selector</h3>
            {/* https://developer.mozilla.org/en-US/docs/Web/CSS/ID_selectors */}
            <p>
                Selects an element based on the value of its <code>id</code> attribute.
            </p>
            <CodeHTML2CSS>{`
                <div class="text:center**#id**">...</div>
            `}</CodeHTML2CSS>
            <h3 id="attribute-selector">Attribute selector</h3>
            {/* https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors */}
            <p>
                Selects all elements that have the given <code>attribute</code>.
            </p>
            <CodeHTML2CSS>{`
                <div class="text:center**[attribute]**">...</div>
            `}</CodeHTML2CSS>
            <ReferenceTable
                title="selector"
                subtitle="description"
                names={[
                    { name: '[value]', description: 'Elements with a value attribute.', mdn: 'Attribute_selectors', caniuse: '[attr]' },
                    { name: '[`attr`=`value`]', description: 'Elements with an attr matching value.', hiddenRef: true },
                    { name: '[`attr`~=`value`]', description: 'Elements whose class attribute contains value.', hiddenRef: true },
                    { name: '[`attr`|=`value`]', description: 'Elements with an attr matching value or value-.', hiddenRef: true },
                    { name: '[`attr`^=`value`]', description: 'Elements with an attr prefixed value', hiddenRef: true },
                    { name: '[`attr`$=`value`]', description: 'Elements with an attr ending value.', hiddenRef: true },
                    { name: '[`attr`*=`value`]', description: 'Elements with an attr containing value.', hiddenRef: true },
                ]}>
            </ReferenceTable>
            <h3 id="descendant-combinator">Descendant Combinator</h3>
            {/* https://developer.mozilla.org/en-US/docs/Web/CSS/Descendant_combinator */}
            <p>
                The _ combinator selects nodes that are descendants of the first element.
            </p>
            <CodeHTML2CSS>{`
                <div class="text:center**_selector2**">...</div>
            `}</CodeHTML2CSS>
            <h3 id="child-combinator">Child Combinator</h3>
            {/* https://developer.mozilla.org/en-US/docs/Web/CSS/Child_combinator */}
            <p>
                The <code>&gt;</code> combinator selects nodes that are direct children of the first element.
                <br />
            </p>
            <CodeHTML2CSS>{`
                <div class="text:center**>selector2**">...</div>
            `}</CodeHTML2CSS>

            <h3 id="general-sibling-combinator">General Sibling Combinator</h3>
            {/* https://developer.mozilla.org/en-US/docs/Web/CSS/General_sibling_combinator */}
            <p>
                The <code>~</code> combinator selects siblings.
                This means that the second element follows the first (though not necessarily immediately), and both share the same parent.
            </p>
            <CodeHTML2CSS>{`
                <div class="text:center**~selector2**">...</div>
            `}</CodeHTML2CSS>
            <h3 id="adjacent-sibling-combinator">Adjacent Sibling Combinator</h3>
            {/* https://developer.mozilla.org/en-US/docs/Web/CSS/Adjacent_sibling_combinator */}
            <p>
                The <code>+</code> combinator matches the second element only if it immediately follows the first element.
            </p>
            <CodeHTML2CSS>{`
                <div class="text:center**+selector2**">...</div>
            `}</CodeHTML2CSS>


            <h2 id="references">References</h2>
            <h3 id="pseudo-classes">Pseudo-classes</h3>
            <p>
                The <code>:</code> pseudo allow the selection of elements based on state information that is not contained in the document tree.
            </p>
            <ReferenceTable
                title="selector"
                subtitle="description"
                noScroll
                names={[
                    { name: ':lang()', description: 'Select an element based on its content language.' },
                    { name: ':any-link', description: 'Matches all elements that match either :link or :visited' },
                    { name: ':link', description: 'Matches links that have not yet been visited.', caniuse: 'CSS%20selector%3A%20%3Alink' },
                    { name: ':visited', description: 'Matches links that have been visited.', caniuse: 'CSS%20selector%3A%20%3Avisited' },
                    { name: ':target', description: 'Matches the element which is the target of the document URL.' },
                    { name: ':scope', description: 'Represents elements that are a reference point for selectors to match against.' },
                    { name: ':hover', description: 'Matches when a user designates an item with a pointing device, for example holding the mouse pointer over it.' },
                    { name: ':active', description: 'Matches when an item is being activated by the user, for example clicked on.' },
                    { name: ':focus', description: 'Matches when an element has focus.', caniuse: 'CSS%20selector%3A%20%3Afocus' },
                    { name: ':focus-visible', description: 'Matches when an element has focus and the user agent identifies that the element should be visibly focused.', caniuse: 'CSS%20selector%3A%20%3Afocus-visible' },
                    { name: ':focus-within', description: 'Matches an element to which :focus applies, plus any element that has a descendant to which :focus applies.' },
                    { name: ':autofill', description: 'Matches when an <input> has been autofilled by the browser.' },
                    { name: ':enabled', description: 'Represents a user interface element that is in an enabled state.' },
                    { name: ':disabled', description: 'Represents a user interface element that is in a disabled state.' },
                    { name: ':read-only', description: 'Represents any element that cannot be changed by the user.' },
                    { name: ':read-write', description: 'Represents any element that is user-editable.' },
                    { name: ':placeholder-shown', description: 'Matches an input element that is displaying placeholder text, for example from the HTML5 placeholder attribute.' },
                    { name: ':default', description: 'Matches one or more UI elements that are the default among a set of elements.' },
                    { name: ':checked', description: 'Matches when elements such as checkboxes and radiobuttons are toggled on.' },
                    { name: ':indeterminate', description: 'Matches when UI elements are in an indeterminate state.' },
                    { name: ':valid', description: 'Matches an element with valid contents. For example an input element with type \'email\' which contains a validly formed email address.' },
                    { name: ':invalid', description: 'Matches an element with invalid contents. For example an input element with type \'email\' with a name entered.' },
                    { name: ':in-range', description: 'Applies to elements with range limitations, for example a slider control, when the selected value is in the allowed range.' },
                    { name: ':out-of-range', description: 'Applies to elements with range limitations, for example a slider control, when the selected value is outside the allowed range.' },
                    { name: ':required', description: 'Matches when a form element is required.' },
                    { name: ':optional', description: 'Matches when a form element is optional.' },
                    { name: ':root', description: 'Represents an element that is the root of the document. In HTML this is usually the <html> element.' },
                    { name: ':empty', description: 'Represents an element with no children other than white-space characters.' },
                    { name: ':nth-child()', description: 'Uses An+B notation to select elements from a list of sibling elements.' },
                    { name: ':nth-last-child()', description: 'Uses An+B notation to select elements from a list of sibling elements, counting backwards from the end of the list.' },
                    { name: ':first-child', description: 'Matches an element that is the first of its siblings.' },
                    { name: ':last-child', description: 'Matches an element that is the last of its siblings.' },
                    { name: ':only-child', description: 'Matches an element that has no siblings. For example a list item with no other list items in that list.' },
                    { name: ':nth-of-type()', description: 'Uses An+B notation to select elements from a list of sibling elements that match a certain type from a list of sibling elements.' },
                    { name: ':nth-last-of-type()', description: 'Uses An+B notation to select elements from a list of sibling elements that match a certain type from a list of sibling elements counting backwards from the end of the list.' },
                    { name: ':first-of-type', description: 'Matches an element that is the first of its siblings, and also matches a certain type selector.' },
                    { name: ':last-of-type', description: 'Matches an element that is the last of its siblings, and also matches a certain type selector.' },
                    { name: ':only-of-type', description: 'Matches an element that has no siblings of the chosen type selector.' },
                    { name: ':defined', description: 'Represents any element that has been defined.' },
                    { name: ':first', description: 'Used with the  @page at-rule, represents the first page of a printed document.', caniuse: 'CSS%20selector%3A%20First%20page%20pseudo-class' },
                    { name: ':fullscreen', description: 'Matches every element which is currently in full-screen mode.' },
                    { name: ':host()', description: 'Allows you to select a custom element from inside its shadow DOM.' },
                    { name: ':host-context()', description: 'Selects the shadow host of the shadow DOM containing the CSS it is used inside.' },
                    { name: ':is()', description: 'Selects any element that can be selected by one of the selectors in that list.' },
                    { name: ':left', description: 'Used with the @page at-rule, represents all left-hand pages of a printed document.' },
                    { name: ':not()', description: 'Represents elements that do not match a list of selectors.' },
                    { name: ':right', description: 'Used with the @page at-rule, represents all right-hand pages of a printed document.' },
                    { name: ':where()', description: 'Selects any element that can be selected by one of the selectors in that list.' }
                ]}>
            </ReferenceTable>

            <h3 id="pseudo-elements">Pseudo-elements</h3>
            <p>
                The <code>::</code> pseudo represent entities that are not included in HTML.
            </p>
            <ReferenceTable
                title="selector"
                subtitle="description"
                noScroll
                names={[
                    { name: '::after', description: 'Creates a pseudo-element that is the last child of the selected element.' },
                    { name: '::before', description: 'Creates a pseudo-element that is the first child of the selected element.' },
                    { name: '::backdrop', description: 'A box the size of the viewport which is rendered immediately beneath any element being presented in full-screen mode.' },
                    { name: '::cue', description: 'Matches WebVTT cues within a selected element.' },
                    { name: '::first-letter', description: 'Applies styles to the first letter of the first line of a block-level element, but only when not preceded by other content (such as images or inline tables).' },
                    { name: '::first-line', description: 'Applies styles to the first line of a block-level element.' },
                    { name: '::file-selector-button', description: 'Represents the button of an <input> of  type="file"' },
                    { name: '::marker', description: 'Selects the marker box of a list item, which typically contains a bullet or number.' },
                    { name: '::part()', description: 'Represents any element within a shadow tree that has a matching part attribute.', caniuse: 'CSS%20selector%3A%20%3A%3Apart' },
                    { name: '::placeholder', description: 'Represents the placeholder text in an &lt;input&gt; or &lt;textarea&gt; element.' },
                    { name: '::selection', description: 'Applies styles to the part of a document that has been highlighted by the user (such as clicking and dragging the mouse across text).' },
                    { name: '::slotted()', description: 'Represents any element that has been placed into a slot inside an HTML template', caniuse: 'CSS%20selector%3A%20%3A%3Aslotted' },
                    { name: '::scrollbar', description: 'The style of an element\'s scrollbar.', caniuse: 'CSS%20%3A%3Awebkit-scrollbar', mdn: '::-webkit-scrollbar' },
                    { name: '::scrollbar-button', description: 'The buttons on the scrollbar ( arrows pointing upwards and downwards that scroll one line at a time ).', caniuse: 'CSS%20selector%3A%20%3A%3A-webkit-scrollbar-button', mdn: '::-webkit-scrollbar' },
                    { name: '::scrollbar-thumb', description: 'The draggable scrolling handle.', caniuse: 'CSS%20selector%3A%20%3A%3A-webkit-scrollbar-thumb', mdn: '::-webkit-scrollbar' },
                    { name: '::scrollbar-track', description: 'The track ( progress bar ) of the scrollbar, where there is a gray bar on top of a white bar.', caniuse: 'CSS%20selector%3A%20%3A%3A-webkit-scrollbar-track', mdn: '::-webkit-scrollbar' },
                    { name: '::scrollbar-track-piece', description: 'The part of the track ( progress bar ) not covered by the handle.', mdn: '::-webkit-scrollbar' },
                    { name: '::scrollbar-corner', description: 'The bottom corner of the scrollbar, where both horizontal and vertical scrollbars meet. This is often the bottom-right corner of the browser window.', mdn: '::-webkit-scrollbar' },
                    { name: '::resizer', description: 'The bottom corner of the scrollbar, where both horizontal and vertical scrollbars meet This is often the bottom-right corner of the browser window.', mdn: '::-webkit-scrollbar' },
                    { name: '::search-cancel-button', description: 'A button ( The "cancel button" ) at the edge of an <input> of type="search" which clears away the current value of the <input> element.', mdn: '::-webkit-search-cancel-button' },
                    { name: '::search-results-button', description: 'A button ( The "search results button" ) at the left edge of an <input> of type="search" which when clicked displays a menu which allows the user to choose from previous recent search queries.', mdn: '::-webkit-search-results-button' },
                ]}>
            </ReferenceTable>
        </>
    )
}

const localeNamespace = 'docs.css.selectors'

Selectors.page = {
    layout: CssDoc,
    title: 'Selectors',
    description: 'CSS selectors define the elements to which a set of CSS rules apply.',
    editors: ['Aron', 'Lola'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
