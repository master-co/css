/* eslint-disable @next/next/no-html-link-for-pages */

export default function StyleASiblingBehindExample() {
    return (
        <label className="inline-flex center-content">
            <input className="text:line-through:checked**+**span cursor:pointer h:16 mr:8 w:16" type="checkbox" defaultChecked />
            <span>½ teaspoon red chili powder (adjust to taste)</span>
        </label>
    )
}