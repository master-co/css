/* eslint-disable @next/next/no-html-link-for-pages */

export default function StyleAnElementBasedOnTargetStateExample() {
    return (
        <label className="inline-flex center-content">
            <input className="cursor:pointer h:16 mr:8 w:16" type="checkbox" defaultChecked />
            <span className="**:checked+**{text:line-through}">½ teaspoon red chili powder (adjust to taste)</span>
        </label>
    )
}