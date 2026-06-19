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

] satisfies PresetUtilitySource[]

export default utilities
