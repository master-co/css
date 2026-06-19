import UtilityType from 'shared/utility-type'
import type { MasterCSSPlanUtility } from 'shared/master-css-plan'

export type PresetUtilitySource = Omit<MasterCSSPlanUtility, 'order'>

const utilities = [
    {
        "id": "animation",
        "name": "animation",
        "type": UtilityType.Shorthand,
        "transform": "animation-token",
        "variableAliasRefs": [
            "=animation",
            "~duration",
            "~easing"
        ],
        "emit": {
            "type": "property",
            "property": "animation"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "animation"
                ]
            }
        ]
    },
    {
        "id": "font",
        "name": "font",
        "type": UtilityType.Shorthand,
        "variableAliasRefs": [
            "~font-family",
            "=font",
            "~font-weight",
            "~font-size"
        ],
        "emit": {
            "type": "property",
            "property": "font"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "font"
                ]
            }
        ]
    },
    {
        "id": "font-variant",
        "name": "font-variant",
        "type": UtilityType.Shorthand,
        "emit": {
            "type": "property",
            "property": "font-variant"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "font-variant"
                ]
            }
        ]
    },
    {
        "id": "grid-column",
        "name": "grid-column",
        "type": UtilityType.Shorthand,
        "emit": {
            "type": "property",
            "property": "grid-column"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-column",
                    "grid-col"
                ]
            }
        ]
    },
    {
        "id": "text-decoration",
        "name": "text-decoration",
        "type": UtilityType.Shorthand,
        "variableAliasRefs": [
            "~color-text",
            "~color"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "-webkit-text-decoration",
                "text-decoration"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-decoration"
                ]
            }
        ]
    },
    {
        "id": "text-wrap",
        "name": "text-wrap",
        "type": UtilityType.Shorthand,
        "emit": {
            "type": "property",
            "property": "text-wrap"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-wrap"
                ]
            }
        ]
    },
    {
        "id": "grid-column-span",
        "name": "grid-column-span",
        "type": UtilityType.Shorthand,
        "emit": {
            "type": "template",
            "declarations": {
                "grid-column": [
                    "span ",
                    null,
                    "/span ",
                    null
                ]
            }
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-col-span",
                    "grid-column-span"
                ]
            }
        ]
    },
    {
        "id": "grid-row-span",
        "name": "grid-row-span",
        "type": UtilityType.Shorthand,
        "emit": {
            "type": "template",
            "declarations": {
                "grid-row": [
                    "span ",
                    null,
                    "/span ",
                    null
                ]
            }
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-row-span"
                ]
            }
        ]
    },
    {
        "id": "grid-rows",
        "name": "grid-rows",
        "type": UtilityType.Shorthand,
        "emit": {
            "type": "template",
            "declarations": {
                "display": "grid",
                "grid-auto-flow": "column",
                "grid-template-rows": [
                    "repeat(",
                    null,
                    ",minmax(0,1fr))"
                ]
            }
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-rows"
                ]
            }
        ]
    },
    {
        "id": "group",
        "name": "group",
        "type": UtilityType.Shorthand,
        "emit": {
            "type": "group"
        },
        "matchers": [
            {
                "type": "group"
            }
        ]
    },
    {
        "id": "max-size",
        "name": "max-size",
        "type": UtilityType.Shorthand,
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "pair",
            "properties": [
                "max-width",
                "max-height"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "max-size"
                ]
            }
        ]
    },
    {
        "id": "min-size",
        "name": "min-size",
        "type": UtilityType.Shorthand,
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "pair",
            "properties": [
                "min-width",
                "min-height"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "min-size"
                ]
            }
        ]
    },
    {
        "id": "size",
        "name": "size",
        "type": UtilityType.Shorthand,
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "pair",
            "properties": [
                "width",
                "height"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "size"
                ]
            }
        ]
    },
    {
        "id": "text-truncate",
        "name": "text-truncate",
        "type": UtilityType.Shorthand,
        "emit": {
            "type": "template",
            "declarations": {
                "display": "-webkit-box",
                "-webkit-box-orient": "vertical",
                "-webkit-line-clamp": null,
                "overflow": "hidden",
                "overflow-wrap": "break-word",
                "text-overflow": "ellipsis"
            }
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "lines",
                    "text-truncate"
                ]
            }
        ]
    },
    {
        "id": "text-size",
        "name": "text-size",
        "type": UtilityType.Shorthand,
        "kind": "number",
        "variableAliasRefs": [
            "~font-size"
        ],
        "emit": {
            "type": "template",
            "declarations": {
                "font-size": null,
                "line-height": [
                    "max(1.8em - max(0rem, ",
                    null,
                    " - 1rem) * 1.12",
                    ", ",
                    null,
                    ")"
                ],
                "letter-spacing": [
                    "clamp(-0.072em, calc((",
                    null,
                    " - 1rem) * -0.048), 0em)"
                ]
            }
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "text"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "text-size"
                ]
            }
        ]
    },
    {
        "id": "animation-delay",
        "name": "animation-delay",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "animation-delay"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "animation-delay"
                ]
            }
        ]
    },
    {
        "id": "animation-name",
        "name": "animation-name",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "animation-name"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "animation-name"
                ]
            }
        ]
    },
    {
        "id": "backdrop-filter",
        "name": "backdrop-filter",
        "type": UtilityType.Normal,
        "variableAliasRefs": [
            "~color"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "-webkit-backdrop-filter",
                "backdrop-filter"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "backdrop-filter"
                ]
            }
        ]
    },
    {
        "id": "background-attachment",
        "name": "background-attachment",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "background-attachment"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "background-attachment"
                ]
            }
        ]
    },
    {
        "id": "background-position",
        "name": "background-position",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "background-position"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "background-position"
                ]
            }
        ]
    },
    {
        "id": "background-repeat",
        "name": "background-repeat",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "background-repeat"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "background-repeat"
                ]
            }
        ]
    },
        {
        "id": "border-collapse",
        "name": "border-collapse",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "border-collapse"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-collapse"
                ]
            }
        ]
    },
    {
        "id": "border-image-repeat",
        "name": "border-image-repeat",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "border-image-repeat"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-image-repeat"
                ]
            }
        ]
    },
                {
        "id": "box-decoration-break",
        "name": "box-decoration-break",
        "type": UtilityType.Normal,
        "emit": {
            "type": "declarations",
            "declarations": [
                "-webkit-box-decoration-break",
                "box-decoration-break"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "box-decoration-break"
                ]
            }
        ]
    },
    {
        "id": "container-type",
        "name": "container-type",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "container-type"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "container-type"
                ]
            }
        ]
    },

    {
        "id": "flex-direction",
        "name": "flex-direction",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "flex-direction"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "flex-direction"
                ]
            }
        ]
    },
    {
        "id": "flex-wrap",
        "name": "flex-wrap",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "flex-wrap"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "flex-wrap"
                ]
            }
        ]
    },
    {
        "id": "font-style",
        "name": "font-style",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "font-style"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "font-style"
                ]
            }
        ]
    },
    {
        "id": "font-variant-numeric",
        "name": "font-variant-numeric",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "font-variant-numeric"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "font-variant-numeric"
                ]
            }
        ]
    },
    {
        "id": "grid-column-end",
        "name": "grid-column-end",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "grid-column-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-column-end",
                    "grid-col-end"
                ]
            }
        ]
    },
    {
        "id": "grid-column-start",
        "name": "grid-column-start",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "grid-column-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-column-start",
                    "grid-col-start"
                ]
            }
        ]
    },
    {
        "id": "grid-template-columns",
        "name": "grid-template-columns",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "grid-template-columns"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-template-columns"
                ]
            }
        ]
    },
    {
        "id": "grid-template-rows",
        "name": "grid-template-rows",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "grid-template-rows"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-template-rows"
                ]
            }
        ]
    },
    {
        "id": "list-style-position",
        "name": "list-style-position",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "list-style-position"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "list-style-position"
                ]
            }
        ]
    },
    {
        "id": "list-style-type",
        "name": "list-style-type",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "list-style-type"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "list-style-type"
                ]
            }
        ]
    },
    {
        "id": "mask-image",
        "name": "mask-image",
        "type": UtilityType.Normal,
        "emit": {
            "type": "declarations",
            "declarations": [
                "-webkit-mask-image",
                "mask-image"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "mask-image"
                ]
            }
        ]
    },
    {
        "id": "object-fit",
        "name": "object-fit",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "object-fit"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "object-fit"
                ]
            }
        ]
    },
    {
        "id": "object-position",
        "name": "object-position",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "object-position"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "object-position"
                ]
            }
        ]
    },
    {
        "id": "outline-style",
        "name": "outline-style",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "outline-style"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "outline-style"
                ]
            }
        ]
    },
    {
        "id": "rotate",
        "name": "rotate",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "rotate"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "rotate"
                ]
            }
        ]
    },
    {
        "id": "scroll-snap-align",
        "name": "scroll-snap-align",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "scroll-snap-align"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-snap-align"
                ]
            }
        ]
    },
    {
        "id": "scroll-snap-stop",
        "name": "scroll-snap-stop",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "scroll-snap-stop"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-snap-stop"
                ]
            }
        ]
    },
    {
        "id": "scroll-snap-type",
        "name": "scroll-snap-type",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "scroll-snap-type"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-snap-type"
                ]
            }
        ]
    },
    {
        "id": "text-align",
        "name": "text-align",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "text-align"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-align"
                ]
            }
        ]
    },
    {
        "id": "text-decoration-line",
        "name": "text-decoration-line",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "text-decoration-line"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-decoration-line"
                ]
            }
        ]
    },
    {
        "id": "text-decoration-style",
        "name": "text-decoration-style",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "text-decoration-style"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-decoration-style"
                ]
            }
        ]
    },
    {
        "id": "text-indent",
        "name": "text-indent",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "text-indent"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-indent"
                ]
            }
        ]
    },
    {
        "id": "text-orientation",
        "name": "text-orientation",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "text-orientation"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-orientation"
                ]
            }
        ]
    },
    {
        "id": "text-overflow",
        "name": "text-overflow",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "text-overflow"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-overflow"
                ]
            }
        ]
    },
    {
        "id": "text-rendering",
        "name": "text-rendering",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "text-rendering"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-rendering"
                ]
            }
        ]
    },
    {
        "id": "text-stroke",
        "name": "text-stroke",
        "type": UtilityType.Normal,
        "emit": {
            "type": "declarations",
            "declarations": [
                "-webkit-text-stroke"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-stroke"
                ]
            }
        ]
    },
    {
        "id": "text-transform",
        "name": "text-transform",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "text-transform"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-transform"
                ]
            }
        ]
    },
    {
        "id": "text-underline-position",
        "name": "text-underline-position",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "text-underline-position"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-underline-position"
                ]
            }
        ]
    },
    {
        "id": "transform",
        "name": "transform",
        "type": UtilityType.Normal,
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "transform"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "transform"
                ]
            }
        ]
    },
    {
        "id": "transform-style",
        "name": "transform-style",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "transform-style"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "transform-style"
                ]
            }
        ]
    },
    {
        "id": "transition-delay",
        "name": "transition-delay",
        "type": UtilityType.Normal,
        "emit": {
            "type": "property",
            "property": "transition-delay"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "transition-delay"
                ]
            }
        ]
    },
    {
        "id": "user-drag",
        "name": "user-drag",
        "type": UtilityType.Normal,
        "emit": {
            "type": "declarations",
            "declarations": [
                "-webkit-user-drag",
                "user-drag"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "user-drag"
                ]
            }
        ]
    },
    {
        "id": "user-select",
        "name": "user-select",
        "type": UtilityType.Normal,
        "emit": {
            "type": "declarations",
            "declarations": [
                "-webkit-user-select",
                "user-select"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "user-select"
                ]
            }
        ]
    },
    {
        "id": "background-image",
        "name": "background-image",
        "type": UtilityType.Normal,
        "kind": "image",
        "variableAliasRefs": [
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "background-image"
        },
        "matchers": [
            {
                "type": "value",
                "keys": [
                    "bg"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "background-image"
                ]
            }
        ]
    },
    {
        "id": "border-image-source",
        "name": "border-image-source",
        "type": UtilityType.Normal,
        "kind": "image",
        "emit": {
            "type": "property",
            "property": "border-image-source"
        },
        "matchers": [
            {
                "type": "value",
                "keys": [
                    "border-image"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-image-source"
                ]
            }
        ]
    },
    {
        "id": "list-style-image",
        "name": "list-style-image",
        "type": UtilityType.Normal,
        "kind": "image",
        "emit": {
            "type": "property",
            "property": "list-style-image"
        },
        "matchers": [
            {
                "type": "value",
                "keys": [
                    "list-style"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "list-style-image"
                ]
            }
        ]
    },
    {
        "id": "background-size",
        "name": "background-size",
        "type": UtilityType.Normal,
        "kind": "number",
        "emit": {
            "type": "property",
            "property": "background-size"
        },
        "matchers": [
            {
                "type": "value",
                "keys": [
                    "bg"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "background-size"
                ]
            }
        ]
    },
                {
        "id": "border-image-outset",
        "name": "border-image-outset",
        "type": UtilityType.Normal,
        "kind": "number",
        "emit": {
            "type": "property",
            "property": "border-image-outset"
        },
        "matchers": [
            {
                "type": "value",
                "keys": [
                    "border-image"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-image-outset"
                ]
            }
        ]
    },
    {
        "id": "border-image-width",
        "name": "border-image-width",
        "type": UtilityType.Normal,
        "kind": "number",
        "emit": {
            "type": "property",
            "property": "border-image-width"
        },
        "matchers": [
            {
                "type": "value",
                "keys": [
                    "border-image"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-image-width"
                ]
            }
        ]
    },

    {
        "id": "transform-origin",
        "name": "transform-origin",
        "type": UtilityType.Normal,
        "kind": "number",
        "emit": {
            "type": "property",
            "property": "transform-origin"
        },
        "matchers": [
            {
                "type": "value",
                "keys": [
                    "transform"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "transform-origin"
                ]
            }
        ]
    },
] satisfies PresetUtilitySource[]

export default utilities
