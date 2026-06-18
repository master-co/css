import UtilityType from 'shared/utility-type'
import type { MasterCSSPlanUtility } from 'shared/master-css-plan'

export type PresetUtilitySource = Omit<MasterCSSPlanUtility, 'order'>

const utilities = [
    {
        "id": "animation",
        "name": "animation",
        "type": UtilityType.NativeShorthand,
        "includeAnimations": true,
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
        "id": "background",
        "name": "background",
        "type": UtilityType.NativeShorthand,
        "variableAliasRefs": [
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "background"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "background",
                    "bg"
                ]
            }
        ]
    },
    {
        "id": "border",
        "name": "border",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border",
                    "b"
                ]
            }
        ]
    },
    {
        "id": "border-block",
        "name": "border-block",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-block"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block"
                ]
            }
        ]
    },
    {
        "id": "border-block-end",
        "name": "border-block-end",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-block-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block-end"
                ]
            }
        ]
    },
    {
        "id": "border-block-start",
        "name": "border-block-start",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-block-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block-start"
                ]
            }
        ]
    },
    {
        "id": "border-bottom",
        "name": "border-bottom",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-bottom"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-bottom",
                    "bb"
                ]
            }
        ]
    },
    {
        "id": "border-inline",
        "name": "border-inline",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-inline"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline"
                ]
            }
        ]
    },
    {
        "id": "border-inline-end",
        "name": "border-inline-end",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-inline-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline-end"
                ]
            }
        ]
    },
    {
        "id": "border-inline-start",
        "name": "border-inline-start",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-inline-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline-start"
                ]
            }
        ]
    },
    {
        "id": "border-left",
        "name": "border-left",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-left"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-left",
                    "bl"
                ]
            }
        ]
    },
    {
        "id": "border-radius",
        "name": "border-radius",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "property",
            "property": "border-radius"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-radius"
                ]
            }
        ]
    },
    {
        "id": "border-right",
        "name": "border-right",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-right"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-right",
                    "br"
                ]
            }
        ]
    },
    {
        "id": "border-style",
        "name": "border-style",
        "type": UtilityType.NativeShorthand,
        "values": [
            "none",
            "auto",
            "hidden",
            "dotted",
            "dashed",
            "solid",
            "double",
            "groove",
            "ridge",
            "inset",
            "outset"
        ],
        "emit": {
            "type": "property",
            "property": "border-style"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "b",
                    "border"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "b",
                    "border"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-style"
                ]
            }
        ]
    },
    {
        "id": "border-top",
        "name": "border-top",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-top"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-top",
                    "bt"
                ]
            }
        ]
    },
    {
        "id": "container",
        "name": "container",
        "type": UtilityType.NativeShorthand,
        "variableAliasRefs": [
            "=container"
        ],
        "emit": {
            "type": "property",
            "property": "container"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "container"
                ]
            }
        ]
    },
    {
        "id": "font",
        "name": "font",
        "type": UtilityType.NativeShorthand,
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
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "font-variant"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "font"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "font-variant"
                ]
            }
        ]
    },
    {
        "id": "gap",
        "name": "gap",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "gap"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "gap"
                ]
            }
        ]
    },
    {
        "id": "grid-column",
        "name": "grid-column",
        "type": UtilityType.NativeShorthand,
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
        "id": "inset",
        "name": "inset",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "inset"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "inset"
                ]
            }
        ]
    },
    {
        "id": "inset-block",
        "name": "inset-block",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "inset-block"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "inset-block"
                ]
            }
        ]
    },
    {
        "id": "inset-inline",
        "name": "inset-inline",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "inset-inline"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "inset-inline"
                ]
            }
        ]
    },
    {
        "id": "margin",
        "name": "margin",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "margin"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin"
                ]
            }
        ]
    },
    {
        "id": "margin-block",
        "name": "margin-block",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "margin-block"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-block"
                ]
            }
        ]
    },
    {
        "id": "margin-inline",
        "name": "margin-inline",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "margin-inline"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-inline"
                ]
            }
        ]
    },
    {
        "id": "outline",
        "name": "outline",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "outline"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "outline"
                ]
            }
        ]
    },
    {
        "id": "padding",
        "name": "padding",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "padding"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding"
                ]
            }
        ]
    },
    {
        "id": "padding-block",
        "name": "padding-block",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "padding-block"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-block"
                ]
            }
        ]
    },
    {
        "id": "padding-inline",
        "name": "padding-inline",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "padding-inline"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-inline"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin",
        "name": "scroll-margin",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-margin"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding",
        "name": "scroll-padding",
        "type": UtilityType.NativeShorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-padding"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding"
                ]
            }
        ]
    },
    {
        "id": "text-decoration",
        "name": "text-decoration",
        "type": UtilityType.NativeShorthand,
        "values": [
            "underline",
            "overline",
            "line-through"
        ],
        "unit": "rem",
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
                    "text-decoration"
                ]
            }
        ]
    },
    {
        "id": "text-wrap",
        "name": "text-wrap",
        "type": UtilityType.NativeShorthand,
        "values": [
            "wrap",
            "nowrap",
            "balance",
            "pretty"
        ],
        "emit": {
            "type": "property",
            "property": "text-wrap"
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
                    "text-wrap"
                ]
            }
        ]
    },
    {
        "id": "transition",
        "name": "transition",
        "type": UtilityType.NativeShorthand,
        "variableAliasRefs": [
            "~duration",
            "~easing"
        ],
        "emit": {
            "type": "property",
            "property": "transition"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "transition"
                ]
            }
        ]
    },
    {
        "id": "border-block-width",
        "name": "border-block-width",
        "type": UtilityType.NativeShorthand,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-block-width"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block-width"
                ]
            }
        ]
    },
    {
        "id": "border-inline-width",
        "name": "border-inline-width",
        "type": UtilityType.NativeShorthand,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-inline-width"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline-width"
                ]
            }
        ]
    },
    {
        "id": "border-width",
        "name": "border-width",
        "type": UtilityType.NativeShorthand,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-width"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "b",
                    "border"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "b",
                    "border"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-width"
                ]
            }
        ]
    },
    {
        "id": "border-block-color",
        "name": "border-block-color",
        "type": UtilityType.NativeShorthand,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-block-color"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block-color"
                ]
            }
        ]
    },
    {
        "id": "border-color",
        "name": "border-color",
        "type": UtilityType.NativeShorthand,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-color"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "b",
                    "border"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "b",
                    "border"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-color"
                ]
            }
        ]
    },
    {
        "id": "border-inline-color",
        "name": "border-inline-color",
        "type": UtilityType.NativeShorthand,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-inline-color"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline-color"
                ]
            }
        ]
    },
    {
        "id": "border-bottom-radius",
        "name": "border-bottom-radius",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-bottom-left-radius",
                "border-bottom-right-radius"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-bottom-radius"
                ]
            }
        ]
    },
    {
        "id": "border-left-radius",
        "name": "border-left-radius",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-top-left-radius",
                "border-bottom-left-radius"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-left-radius"
                ]
            }
        ]
    },
    {
        "id": "border-right-radius",
        "name": "border-right-radius",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-top-right-radius",
                "border-bottom-right-radius"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-right-radius"
                ]
            }
        ]
    },
    {
        "id": "border-top-radius",
        "name": "border-top-radius",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-top-left-radius",
                "border-top-right-radius"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-top-radius"
                ]
            }
        ]
    },
    {
        "id": "border-x",
        "name": "border-x",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-left",
                "border-right"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "bx",
                    "border-x"
                ]
            }
        ]
    },
    {
        "id": "border-x-style",
        "name": "border-x-style",
        "type": UtilityType.Shorthand,
        "values": [
            "none",
            "auto",
            "hidden",
            "dotted",
            "dashed",
            "solid",
            "double",
            "groove",
            "ridge",
            "inset",
            "outset"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-left-style",
                "border-right-style"
            ]
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bx",
                    "border-x"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bx",
                    "border-x"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-x-style"
                ]
            }
        ]
    },
    {
        "id": "border-y",
        "name": "border-y",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "transform": "auto-fill-solid",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-top",
                "border-bottom"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "by",
                    "border-y"
                ]
            }
        ]
    },
    {
        "id": "border-y-style",
        "name": "border-y-style",
        "type": UtilityType.Shorthand,
        "values": [
            "none",
            "auto",
            "hidden",
            "dotted",
            "dashed",
            "solid",
            "double",
            "groove",
            "ridge",
            "inset",
            "outset"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-top-style",
                "border-bottom-style"
            ]
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "by",
                    "border-y"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "by",
                    "border-y"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-y-style"
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
        "id": "grid-columns",
        "name": "grid-columns",
        "type": UtilityType.Shorthand,
        "emit": {
            "type": "template",
            "declarations": {
                "display": "grid",
                "grid-template-columns": [
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
                    "grid-cols",
                    "grid-columns"
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
        "id": "margin-x",
        "name": "margin-x",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "margin-left",
                "margin-right"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-x",
                    "margin-x"
                ]
            }
        ]
    },
    {
        "id": "margin-y",
        "name": "margin-y",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "margin-top",
                "margin-bottom"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-y"
                ]
            }
        ]
    },
    {
        "id": "max-size",
        "name": "max-size",
        "type": UtilityType.Shorthand,
        "unit": "rem",
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
        "unit": "rem",
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
        "id": "padding-x",
        "name": "padding-x",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "padding-left",
                "padding-right"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-x"
                ]
            }
        ]
    },
    {
        "id": "padding-y",
        "name": "padding-y",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "padding-top",
                "padding-bottom"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-y"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-x",
        "name": "scroll-margin-x",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "scroll-margin-left",
                "scroll-margin-right"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-x"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-y",
        "name": "scroll-margin-y",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "scroll-margin-top",
                "scroll-margin-bottom"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-y"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-x",
        "name": "scroll-padding-x",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "scroll-padding-left",
                "scroll-padding-right"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-x"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-y",
        "name": "scroll-padding-y",
        "type": UtilityType.Shorthand,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "scroll-padding-top",
                "scroll-padding-bottom"
            ]
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-y"
                ]
            }
        ]
    },
    {
        "id": "size",
        "name": "size",
        "type": UtilityType.Shorthand,
        "unit": "rem",
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
        "id": "variable",
        "name": "variable",
        "type": UtilityType.Shorthand,
        "emit": {
            "type": "css-variable-assignment"
        },
        "matchers": [
            {
                "type": "css-variable-assignment"
            }
        ]
    },
    {
        "id": "border-x-width",
        "name": "border-x-width",
        "type": UtilityType.Shorthand,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-left-width",
                "border-right-width"
            ]
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bx",
                    "border-x"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bx",
                    "border-x"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-x-width"
                ]
            }
        ]
    },
    {
        "id": "border-y-width",
        "name": "border-y-width",
        "type": UtilityType.Shorthand,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-top-width",
                "border-bottom-width"
            ]
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "by",
                    "border-y"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "by",
                    "border-y"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-y-width"
                ]
            }
        ]
    },
    {
        "id": "text-size",
        "name": "text-size",
        "type": UtilityType.Shorthand,
        "kind": "number",
        "unit": "rem",
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
        "id": "border-x-color",
        "name": "border-x-color",
        "type": UtilityType.Shorthand,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-left-color",
                "border-right-color"
            ]
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bx",
                    "border-x"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bx",
                    "border-x"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-x-color"
                ]
            }
        ]
    },
    {
        "id": "border-y-color",
        "name": "border-y-color",
        "type": UtilityType.Shorthand,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "border-top-color",
                "border-bottom-color"
            ]
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "by",
                    "border-y"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "by",
                    "border-y"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-y-color"
                ]
            }
        ]
    },
    {
        "id": "accent-color",
        "name": "accent-color",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "accent-color"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "accent-color"
                ]
            }
        ]
    },
    {
        "id": "animation-delay",
        "name": "animation-delay",
        "type": UtilityType.Native,
        "unit": "ms",
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
        "id": "animation-duration",
        "name": "animation-duration",
        "type": UtilityType.Native,
        "unit": "ms",
        "variableAliasRefs": [
            "~duration"
        ],
        "emit": {
            "type": "property",
            "property": "animation-duration"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "animation-duration"
                ]
            }
        ]
    },
    {
        "id": "animation-name",
        "name": "animation-name",
        "type": UtilityType.Native,
        "includeAnimations": true,
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
        "id": "animation-timing-function",
        "name": "animation-timing-function",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~easing"
        ],
        "emit": {
            "type": "property",
            "property": "animation-timing-function"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "animation-timing-function"
                ]
            }
        ]
    },
    {
        "id": "backdrop-filter",
        "name": "backdrop-filter",
        "type": UtilityType.Native,
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
        "type": UtilityType.Native,
        "values": [
            "fixed",
            "local",
            "scroll"
        ],
        "emit": {
            "type": "property",
            "property": "background-attachment"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bg"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bg"
                ]
            },
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
        "type": UtilityType.Native,
        "values": [
            "top",
            "bottom",
            "right",
            "left",
            "center"
        ],
        "unit": "px",
        "emit": {
            "type": "property",
            "property": "background-position"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bg"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bg"
                ]
            },
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
        "type": UtilityType.Native,
        "values": [
            "space",
            "round",
            "repeat",
            "no-repeat",
            "repeat-x",
            "repeat-y"
        ],
        "emit": {
            "type": "property",
            "property": "background-repeat"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bg"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bg"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "background-repeat"
                ]
            }
        ]
    },
    {
        "id": "block-size",
        "name": "block-size",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "block-size"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "block-size"
                ]
            }
        ]
    },
    {
        "id": "border-bottom-left-radius",
        "name": "border-bottom-left-radius",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "property",
            "property": "border-bottom-left-radius"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-bottom-left-radius"
                ]
            }
        ]
    },
    {
        "id": "border-bottom-right-radius",
        "name": "border-bottom-right-radius",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "property",
            "property": "border-bottom-right-radius"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-bottom-right-radius"
                ]
            }
        ]
    },
    {
        "id": "border-bottom-style",
        "name": "border-bottom-style",
        "type": UtilityType.Native,
        "values": [
            "none",
            "auto",
            "hidden",
            "dotted",
            "dashed",
            "solid",
            "double",
            "groove",
            "ridge",
            "inset",
            "outset"
        ],
        "emit": {
            "type": "property",
            "property": "border-bottom-style"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bb",
                    "border-bottom"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bb",
                    "border-bottom"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-bottom-style"
                ]
            }
        ]
    },
    {
        "id": "border-collapse",
        "name": "border-collapse",
        "type": UtilityType.Native,
        "values": [
            "collapse",
            "separate"
        ],
        "emit": {
            "type": "property",
            "property": "border-collapse"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "b",
                    "border"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "b",
                    "border"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-collapse"
                ]
            }
        ]
    },
    {
        "id": "border-end-end-radius",
        "name": "border-end-end-radius",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "property",
            "property": "border-end-end-radius"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-end-end-radius"
                ]
            }
        ]
    },
    {
        "id": "border-end-start-radius",
        "name": "border-end-start-radius",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "property",
            "property": "border-end-start-radius"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-end-start-radius"
                ]
            }
        ]
    },
    {
        "id": "border-image-repeat",
        "name": "border-image-repeat",
        "type": UtilityType.Native,
        "values": [
            "stretch",
            "repeat",
            "round",
            "space"
        ],
        "emit": {
            "type": "property",
            "property": "border-image-repeat"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "border-image"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "border-image"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-image-repeat"
                ]
            }
        ]
    },
    {
        "id": "border-left-style",
        "name": "border-left-style",
        "type": UtilityType.Native,
        "values": [
            "none",
            "auto",
            "hidden",
            "dotted",
            "dashed",
            "solid",
            "double",
            "groove",
            "ridge",
            "inset",
            "outset"
        ],
        "emit": {
            "type": "property",
            "property": "border-left-style"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bl",
                    "border-left"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bl",
                    "border-left"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-left-style"
                ]
            }
        ]
    },
    {
        "id": "border-right-style",
        "name": "border-right-style",
        "type": UtilityType.Native,
        "values": [
            "none",
            "auto",
            "hidden",
            "dotted",
            "dashed",
            "solid",
            "double",
            "groove",
            "ridge",
            "inset",
            "outset"
        ],
        "emit": {
            "type": "property",
            "property": "border-right-style"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "br",
                    "border-right"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "br",
                    "border-right"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-right-style"
                ]
            }
        ]
    },
    {
        "id": "border-spacing",
        "name": "border-spacing",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "border-spacing"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-spacing"
                ]
            }
        ]
    },
    {
        "id": "border-start-end-radius",
        "name": "border-start-end-radius",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "property",
            "property": "border-start-end-radius"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-start-end-radius"
                ]
            }
        ]
    },
    {
        "id": "border-start-start-radius",
        "name": "border-start-start-radius",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "property",
            "property": "border-start-start-radius"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-start-start-radius"
                ]
            }
        ]
    },
    {
        "id": "border-top-left-radius",
        "name": "border-top-left-radius",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "property",
            "property": "border-top-left-radius"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-top-left-radius"
                ]
            }
        ]
    },
    {
        "id": "border-top-right-radius",
        "name": "border-top-right-radius",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~radius"
        ],
        "emit": {
            "type": "property",
            "property": "border-top-right-radius"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-top-right-radius"
                ]
            }
        ]
    },
    {
        "id": "border-top-style",
        "name": "border-top-style",
        "type": UtilityType.Native,
        "values": [
            "none",
            "auto",
            "hidden",
            "dotted",
            "dashed",
            "solid",
            "double",
            "groove",
            "ridge",
            "inset",
            "outset"
        ],
        "emit": {
            "type": "property",
            "property": "border-top-style"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bt",
                    "border-top"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bt",
                    "border-top"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-top-style"
                ]
            }
        ]
    },
    {
        "id": "bottom",
        "name": "bottom",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "bottom"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "bottom"
                ]
            }
        ]
    },
    {
        "id": "box-decoration-break",
        "name": "box-decoration-break",
        "type": UtilityType.Native,
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
        "id": "box-shadow",
        "name": "box-shadow",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~shadow",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "box-shadow"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "box-shadow"
                ]
            }
        ]
    },
    {
        "id": "caret-color",
        "name": "caret-color",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~color-text",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "caret-color"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "caret-color"
                ]
            }
        ]
    },
    {
        "id": "color",
        "name": "color",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "=color",
            "~color-text",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "color"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "color"
                ]
            }
        ]
    },
    {
        "id": "column-gap",
        "name": "column-gap",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "column-gap"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "column-gap"
                ]
            }
        ]
    },
    {
        "id": "contain-intrinsic-block-size",
        "name": "contain-intrinsic-block-size",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "contain-intrinsic-block-size"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "contain-intrinsic-block-size"
                ]
            }
        ]
    },
    {
        "id": "contain-intrinsic-inline-size",
        "name": "contain-intrinsic-inline-size",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "contain-intrinsic-inline-size"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "contain-intrinsic-inline-size"
                ]
            }
        ]
    },
    {
        "id": "container-type",
        "name": "container-type",
        "type": UtilityType.Native,
        "values": [
            "size",
            "inline-size",
            "scroll-state"
        ],
        "emit": {
            "type": "property",
            "property": "container-type"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "container"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "container"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "container-type"
                ]
            }
        ]
    },
    {
        "id": "cx",
        "name": "cx",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "cx"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "cx"
                ]
            }
        ]
    },
    {
        "id": "cy",
        "name": "cy",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "cy"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "cy"
                ]
            }
        ]
    },
    {
        "id": "fill",
        "name": "fill",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "fill"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "fill"
                ]
            }
        ]
    },
    {
        "id": "filter",
        "name": "filter",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "filter"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "filter"
                ]
            }
        ]
    },
    {
        "id": "flex-basis",
        "name": "flex-basis",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "flex-basis"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "flex"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "flex"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "flex-basis"
                ]
            }
        ]
    },
    {
        "id": "flex-direction",
        "name": "flex-direction",
        "type": UtilityType.Native,
        "values": [
            "row",
            "row-reverse",
            "column",
            "column-reverse"
        ],
        "emit": {
            "type": "property",
            "property": "flex-direction"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "flex"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "flex"
                ]
            },
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
        "type": UtilityType.Native,
        "values": [
            "wrap",
            "nowrap",
            "wrap-reverse"
        ],
        "emit": {
            "type": "property",
            "property": "flex-wrap"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "flex"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "flex"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "flex-wrap"
                ]
            }
        ]
    },
    {
        "id": "font-family",
        "name": "font-family",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "=font-family"
        ],
        "emit": {
            "type": "property",
            "property": "font-family"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "font"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "font-family"
                ]
            }
        ]
    },
    {
        "id": "font-feature-settings",
        "name": "font-feature-settings",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "=font-feature"
        ],
        "emit": {
            "type": "property",
            "property": "font-feature-settings"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "font-feature-settings"
                ]
            }
        ]
    },
    {
        "id": "font-style",
        "name": "font-style",
        "type": UtilityType.Native,
        "values": [
            "normal",
            "italic",
            "oblique"
        ],
        "unit": "deg",
        "emit": {
            "type": "property",
            "property": "font-style"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "font"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font"
                ]
            },
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
        "type": UtilityType.Native,
        "values": [
            "ordinal",
            "slashed-zero",
            "lining-nums",
            "oldstyle-nums",
            "proportional-nums",
            "tabular-nums",
            "diagonal-fractions",
            "stacked-fractions"
        ],
        "emit": {
            "type": "property",
            "property": "font-variant-numeric"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "font"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "font-variant-numeric"
                ]
            }
        ]
    },
    {
        "id": "font-weight",
        "name": "font-weight",
        "type": UtilityType.Native,
        "values": [
            "bolder"
        ],
        "variableAliasRefs": [
            "=font-weight"
        ],
        "emit": {
            "type": "property",
            "property": "font-weight"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "font"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "font-weight"
                ]
            }
        ]
    },
    {
        "id": "grid-column-end",
        "name": "grid-column-end",
        "type": UtilityType.Native,
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
        "type": UtilityType.Native,
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
        "type": UtilityType.Native,
        "unit": "rem",
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
        "type": UtilityType.Native,
        "unit": "rem",
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
        "id": "height",
        "name": "height",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "height"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "height"
                ]
            }
        ]
    },
    {
        "id": "inline-size",
        "name": "inline-size",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "inline-size"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "inline-size"
                ]
            }
        ]
    },
    {
        "id": "inset-block-end",
        "name": "inset-block-end",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "inset-block-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "inset-block-end"
                ]
            }
        ]
    },
    {
        "id": "inset-block-start",
        "name": "inset-block-start",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "inset-block-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "inset-block-start"
                ]
            }
        ]
    },
    {
        "id": "inset-inline-end",
        "name": "inset-inline-end",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "inset-inline-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "inset-inline-end"
                ]
            }
        ]
    },
    {
        "id": "inset-inline-start",
        "name": "inset-inline-start",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "inset-inline-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "inset-inline-start"
                ]
            }
        ]
    },
    {
        "id": "left",
        "name": "left",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "left"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "left"
                ]
            }
        ]
    },
    {
        "id": "letter-spacing",
        "name": "letter-spacing",
        "type": UtilityType.Native,
        "unit": "em",
        "variableAliasRefs": [
            "~tracking"
        ],
        "emit": {
            "type": "property",
            "property": "letter-spacing"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "letter-spacing"
                ]
            }
        ]
    },
    {
        "id": "line-height",
        "name": "line-height",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~leading"
        ],
        "emit": {
            "type": "property",
            "property": "line-height"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "line-height"
                ]
            }
        ]
    },
    {
        "id": "list-style-position",
        "name": "list-style-position",
        "type": UtilityType.Native,
        "values": [
            "inside",
            "outside"
        ],
        "emit": {
            "type": "property",
            "property": "list-style-position"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "list-style"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "list-style"
                ]
            },
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
        "type": UtilityType.Native,
        "values": [
            "disc",
            "decimal"
        ],
        "emit": {
            "type": "property",
            "property": "list-style-type"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "list-style"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "list-style"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "list-style-type"
                ]
            }
        ]
    },
    {
        "id": "margin-block-end",
        "name": "margin-block-end",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "margin-block-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-block-end"
                ]
            }
        ]
    },
    {
        "id": "margin-block-start",
        "name": "margin-block-start",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "margin-block-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-block-start"
                ]
            }
        ]
    },
    {
        "id": "margin-bottom",
        "name": "margin-bottom",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "margin-bottom"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-bottom"
                ]
            }
        ]
    },
    {
        "id": "margin-inline-end",
        "name": "margin-inline-end",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "margin-inline-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-inline-end"
                ]
            }
        ]
    },
    {
        "id": "margin-inline-start",
        "name": "margin-inline-start",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "margin-inline-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-inline-start"
                ]
            }
        ]
    },
    {
        "id": "margin-left",
        "name": "margin-left",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "margin-left"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-left"
                ]
            }
        ]
    },
    {
        "id": "margin-right",
        "name": "margin-right",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "margin-right"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-right"
                ]
            }
        ]
    },
    {
        "id": "margin-top",
        "name": "margin-top",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "margin-top"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "margin-top"
                ]
            }
        ]
    },
    {
        "id": "mask-image",
        "name": "mask-image",
        "type": UtilityType.Native,
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
        "id": "max-block-size",
        "name": "max-block-size",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "max-block-size"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "max-block-size"
                ]
            }
        ]
    },
    {
        "id": "max-height",
        "name": "max-height",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "max-height"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "max-height"
                ]
            }
        ]
    },
    {
        "id": "max-inline-size",
        "name": "max-inline-size",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "max-inline-size"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "max-inline-size"
                ]
            }
        ]
    },
    {
        "id": "max-width",
        "name": "max-width",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "max-width"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "max-width"
                ]
            }
        ]
    },
    {
        "id": "min-block-size",
        "name": "min-block-size",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "min-block-size"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "min-block-size"
                ]
            }
        ]
    },
    {
        "id": "min-height",
        "name": "min-height",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "min-height"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "min-height"
                ]
            }
        ]
    },
    {
        "id": "min-inline-size",
        "name": "min-inline-size",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "min-inline-size"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "min-inline-size"
                ]
            }
        ]
    },
    {
        "id": "min-width",
        "name": "min-width",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "min-width"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "min-width"
                ]
            }
        ]
    },
    {
        "id": "object-fit",
        "name": "object-fit",
        "type": UtilityType.Native,
        "values": [
            "contain",
            "cover",
            "fill",
            "scale-down"
        ],
        "emit": {
            "type": "property",
            "property": "object-fit"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "object"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "object"
                ]
            },
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
        "type": UtilityType.Native,
        "values": [
            "top",
            "bottom",
            "right",
            "left",
            "center"
        ],
        "emit": {
            "type": "property",
            "property": "object-position"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "object"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "object"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "object-position"
                ]
            }
        ]
    },
    {
        "id": "order",
        "name": "order",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "=order"
        ],
        "emit": {
            "type": "property",
            "property": "order"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "order"
                ]
            }
        ]
    },
    {
        "id": "outline-offset",
        "name": "outline-offset",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "outline-offset"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "outline-offset"
                ]
            }
        ]
    },
    {
        "id": "outline-style",
        "name": "outline-style",
        "type": UtilityType.Native,
        "values": [
            "none",
            "auto",
            "hidden",
            "dotted",
            "dashed",
            "solid",
            "double",
            "groove",
            "ridge",
            "inset",
            "outset"
        ],
        "emit": {
            "type": "property",
            "property": "outline-style"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "outline"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "outline"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "outline-style"
                ]
            }
        ]
    },
    {
        "id": "padding-block-end",
        "name": "padding-block-end",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "padding-block-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-block-end"
                ]
            }
        ]
    },
    {
        "id": "padding-block-start",
        "name": "padding-block-start",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "padding-block-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-block-start"
                ]
            }
        ]
    },
    {
        "id": "padding-bottom",
        "name": "padding-bottom",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "padding-bottom"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-bottom"
                ]
            }
        ]
    },
    {
        "id": "padding-inline-end",
        "name": "padding-inline-end",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "padding-inline-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-inline-end"
                ]
            }
        ]
    },
    {
        "id": "padding-inline-start",
        "name": "padding-inline-start",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "padding-inline-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-inline-start"
                ]
            }
        ]
    },
    {
        "id": "padding-left",
        "name": "padding-left",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "padding-left"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-left"
                ]
            }
        ]
    },
    {
        "id": "padding-right",
        "name": "padding-right",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "padding-right"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-right"
                ]
            }
        ]
    },
    {
        "id": "padding-top",
        "name": "padding-top",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "padding-top"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "padding-top"
                ]
            }
        ]
    },
    {
        "id": "right",
        "name": "right",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "right"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "right"
                ]
            }
        ]
    },
    {
        "id": "rotate",
        "name": "rotate",
        "type": UtilityType.Native,
        "unit": "deg",
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
        "id": "row-gap",
        "name": "row-gap",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "row-gap"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "row-gap"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-bottom",
        "name": "scroll-margin-bottom",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-margin-bottom"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-bottom"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-left",
        "name": "scroll-margin-left",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-margin-left"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-left"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-right",
        "name": "scroll-margin-right",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-margin-right"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-right"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-top",
        "name": "scroll-margin-top",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-margin-top"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-top"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-bottom",
        "name": "scroll-padding-bottom",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-padding-bottom"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-bottom"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-left",
        "name": "scroll-padding-left",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-padding-left"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-left"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-right",
        "name": "scroll-padding-right",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-padding-right"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-right"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-top",
        "name": "scroll-padding-top",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-padding-top"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-top"
                ]
            }
        ]
    },
    {
        "id": "scroll-snap-align",
        "name": "scroll-snap-align",
        "type": UtilityType.Native,
        "values": [
            "start",
            "end",
            "center"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-snap-align"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "scroll-snap"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "scroll-snap"
                ]
            },
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
        "type": UtilityType.Native,
        "values": [
            "normal",
            "always"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-snap-stop"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "scroll-snap"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "scroll-snap"
                ]
            },
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
        "type": UtilityType.Native,
        "values": [
            "x",
            "y",
            "block",
            "inline",
            "both"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-snap-type"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "scroll-snap"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "scroll-snap"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "scroll-snap-type"
                ]
            }
        ]
    },
    {
        "id": "stroke",
        "name": "stroke",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "stroke"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "stroke"
                ]
            }
        ]
    },
    {
        "id": "stroke-dashoffset",
        "name": "stroke-dashoffset",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "stroke-dashoffset"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "stroke-dashoffset"
                ]
            }
        ]
    },
    {
        "id": "text-align",
        "name": "text-align",
        "type": UtilityType.Native,
        "values": [
            "justify",
            "center",
            "left",
            "right",
            "start",
            "end"
        ],
        "emit": {
            "type": "property",
            "property": "text-align"
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
                    "text-align"
                ]
            }
        ]
    },
    {
        "id": "text-decoration-line",
        "name": "text-decoration-line",
        "type": UtilityType.Native,
        "values": [
            "underline",
            "overline",
            "line-through"
        ],
        "emit": {
            "type": "property",
            "property": "text-decoration-line"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "text-decoration"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text-decoration"
                ]
            },
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
        "type": UtilityType.Native,
        "values": [
            "solid",
            "double",
            "dotted",
            "dashed",
            "wavy"
        ],
        "emit": {
            "type": "property",
            "property": "text-decoration-style"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "text-decoration"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text-decoration"
                ]
            },
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
        "type": UtilityType.Native,
        "unit": "rem",
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
        "type": UtilityType.Native,
        "values": [
            "mixed",
            "upright",
            "sideways-right",
            "sideways",
            "use-glyph-orientation"
        ],
        "emit": {
            "type": "property",
            "property": "text-orientation"
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
                    "text-orientation"
                ]
            }
        ]
    },
    {
        "id": "text-overflow",
        "name": "text-overflow",
        "type": UtilityType.Native,
        "values": [
            "ellipsis",
            "clip"
        ],
        "emit": {
            "type": "property",
            "property": "text-overflow"
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
                    "text-overflow"
                ]
            }
        ]
    },
    {
        "id": "text-rendering",
        "name": "text-rendering",
        "type": UtilityType.Native,
        "values": [
            "optimizeSpeed",
            "optimizeLegibility",
            "geometricPrecision"
        ],
        "emit": {
            "type": "property",
            "property": "text-rendering"
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
                    "text-rendering"
                ]
            }
        ]
    },
    {
        "id": "text-shadow",
        "name": "text-shadow",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "text-shadow"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "text-shadow"
                ]
            }
        ]
    },
    {
        "id": "text-stroke",
        "name": "text-stroke",
        "type": UtilityType.Native,
        "unit": "rem",
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
        "type": UtilityType.Native,
        "values": [
            "uppercase",
            "lowercase",
            "capitalize"
        ],
        "emit": {
            "type": "property",
            "property": "text-transform"
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
                    "text-transform"
                ]
            }
        ]
    },
    {
        "id": "text-underline-offset",
        "name": "text-underline-offset",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "text-underline-offset"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "text-underline"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text-underline"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "text-underline-offset"
                ]
            }
        ]
    },
    {
        "id": "text-underline-position",
        "name": "text-underline-position",
        "type": UtilityType.Native,
        "values": [
            "front-font",
            "under",
            "left",
            "right"
        ],
        "emit": {
            "type": "property",
            "property": "text-underline-position"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "text-underline"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text-underline"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "text-underline-position"
                ]
            }
        ]
    },
    {
        "id": "top",
        "name": "top",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "top"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "top"
                ]
            }
        ]
    },
    {
        "id": "transform",
        "name": "transform",
        "type": UtilityType.Native,
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
        "type": UtilityType.Native,
        "values": [
            "flat",
            "preserve-3d"
        ],
        "emit": {
            "type": "property",
            "property": "transform-style"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "transform"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "transform"
                ]
            },
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
        "type": UtilityType.Native,
        "unit": "ms",
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
        "id": "transition-duration",
        "name": "transition-duration",
        "type": UtilityType.Native,
        "unit": "ms",
        "variableAliasRefs": [
            "~duration"
        ],
        "emit": {
            "type": "property",
            "property": "transition-duration"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "transition-duration"
                ]
            }
        ]
    },
    {
        "id": "transition-timing-function",
        "name": "transition-timing-function",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~easing"
        ],
        "emit": {
            "type": "property",
            "property": "transition-timing-function"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "transition-timing-function"
                ]
            }
        ]
    },
    {
        "id": "translate",
        "name": "translate",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "translate"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "translate"
                ]
            }
        ]
    },
    {
        "id": "user-drag",
        "name": "user-drag",
        "type": UtilityType.Native,
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
        "type": UtilityType.Native,
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
        "id": "width",
        "name": "width",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "width"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "width"
                ]
            }
        ]
    },
    {
        "id": "word-spacing",
        "name": "word-spacing",
        "type": UtilityType.Native,
        "unit": "em",
        "emit": {
            "type": "property",
            "property": "word-spacing"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "word-spacing"
                ]
            }
        ]
    },
    {
        "id": "x",
        "name": "x",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "x"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "x"
                ]
            }
        ]
    },
    {
        "id": "y",
        "name": "y",
        "type": UtilityType.Native,
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "y"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "y"
                ]
            }
        ]
    },
    {
        "id": "background-image",
        "name": "background-image",
        "type": UtilityType.Native,
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
                "type": "variable",
                "keys": [
                    "bg"
                ]
            },
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
        "type": UtilityType.Native,
        "kind": "image",
        "emit": {
            "type": "property",
            "property": "border-image-source"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "border-image"
                ]
            },
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
        "type": UtilityType.Native,
        "kind": "image",
        "emit": {
            "type": "property",
            "property": "list-style-image"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "list-style"
                ]
            },
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
        "type": UtilityType.Native,
        "values": [
            "auto",
            "cover",
            "contain"
        ],
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "background-size"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bg"
                ]
            },
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
        "id": "border-block-end-width",
        "name": "border-block-end-width",
        "type": UtilityType.Native,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-block-end-width"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block-end-width"
                ]
            }
        ]
    },
    {
        "id": "border-block-start-width",
        "name": "border-block-start-width",
        "type": UtilityType.Native,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-block-start-width"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block-start-width"
                ]
            }
        ]
    },
    {
        "id": "border-bottom-width",
        "name": "border-bottom-width",
        "type": UtilityType.Native,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-bottom-width"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bb",
                    "border-bottom"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bb",
                    "border-bottom"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-bottom-width"
                ]
            }
        ]
    },
    {
        "id": "border-image-outset",
        "name": "border-image-outset",
        "type": UtilityType.Native,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-image-outset"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "border-image"
                ]
            },
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
        "type": UtilityType.Native,
        "values": [
            "auto"
        ],
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-image-width"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "border-image"
                ]
            },
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
        "id": "border-inline-end-width",
        "name": "border-inline-end-width",
        "type": UtilityType.Native,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-inline-end-width"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline-end-width"
                ]
            }
        ]
    },
    {
        "id": "border-inline-start-width",
        "name": "border-inline-start-width",
        "type": UtilityType.Native,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-inline-start-width"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline-start-width"
                ]
            }
        ]
    },
    {
        "id": "border-left-width",
        "name": "border-left-width",
        "type": UtilityType.Native,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-left-width"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bl",
                    "border-left"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bl",
                    "border-left"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-left-width"
                ]
            }
        ]
    },
    {
        "id": "border-right-width",
        "name": "border-right-width",
        "type": UtilityType.Native,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-right-width"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "br",
                    "border-right"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "br",
                    "border-right"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-right-width"
                ]
            }
        ]
    },
    {
        "id": "border-top-width",
        "name": "border-top-width",
        "type": UtilityType.Native,
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "border-top-width"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bt",
                    "border-top"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bt",
                    "border-top"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-top-width"
                ]
            }
        ]
    },
    {
        "id": "font-size",
        "name": "font-size",
        "type": UtilityType.Native,
        "kind": "number",
        "unit": "rem",
        "variableAliasRefs": [
            "=font-size"
        ],
        "emit": {
            "type": "property",
            "property": "font-size"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "font"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "font-size"
                ]
            }
        ]
    },
    {
        "id": "outline-width",
        "name": "outline-width",
        "type": UtilityType.Native,
        "values": [
            "medium",
            "thick",
            "thin"
        ],
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "outline-width"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "outline"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "outline"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "outline-width"
                ]
            }
        ]
    },
    {
        "id": "shape-margin",
        "name": "shape-margin",
        "type": UtilityType.Native,
        "kind": "number",
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "shape-margin"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "shape-margin"
                ]
            }
        ]
    },
    {
        "id": "stroke-width",
        "name": "stroke-width",
        "type": UtilityType.Native,
        "kind": "number",
        "emit": {
            "type": "property",
            "property": "stroke-width"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "stroke"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "stroke"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "stroke-width"
                ]
            }
        ]
    },
    {
        "id": "text-decoration-thickness",
        "name": "text-decoration-thickness",
        "type": UtilityType.Native,
        "values": [
            "from-font"
        ],
        "kind": "number",
        "unit": "em",
        "emit": {
            "type": "property",
            "property": "text-decoration-thickness"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "text-decoration"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text-decoration"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "text-decoration-thickness"
                ]
            }
        ]
    },
    {
        "id": "text-stroke-width",
        "name": "text-stroke-width",
        "type": UtilityType.Native,
        "values": [
            "thin",
            "medium",
            "thick"
        ],
        "kind": "number",
        "unit": "rem",
        "emit": {
            "type": "declarations",
            "declarations": [
                "-webkit-text-stroke-width"
            ]
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "text-stroke"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text-stroke"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "text-stroke-width"
                ]
            }
        ]
    },
    {
        "id": "transform-origin",
        "name": "transform-origin",
        "type": UtilityType.Native,
        "values": [
            "top",
            "bottom",
            "right",
            "left",
            "center"
        ],
        "kind": "number",
        "unit": "px",
        "emit": {
            "type": "property",
            "property": "transform-origin"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "transform"
                ]
            },
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
    {
        "id": "background-color",
        "name": "background-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "background-color"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bg"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bg"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "background-color"
                ]
            }
        ]
    },
    {
        "id": "border-block-end-color",
        "name": "border-block-end-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-block-end-color"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block-end-color"
                ]
            }
        ]
    },
    {
        "id": "border-block-start-color",
        "name": "border-block-start-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-block-start-color"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block-start-color"
                ]
            }
        ]
    },
    {
        "id": "border-bottom-color",
        "name": "border-bottom-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-bottom-color"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bb",
                    "border-bottom"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bb",
                    "border-bottom"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-bottom-color"
                ]
            }
        ]
    },
    {
        "id": "border-inline-end-color",
        "name": "border-inline-end-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-inline-end-color"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline-end-color"
                ]
            }
        ]
    },
    {
        "id": "border-inline-start-color",
        "name": "border-inline-start-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-inline-start-color"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline-start-color"
                ]
            }
        ]
    },
    {
        "id": "border-left-color",
        "name": "border-left-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-left-color"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bl",
                    "border-left"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bl",
                    "border-left"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-left-color"
                ]
            }
        ]
    },
    {
        "id": "border-right-color",
        "name": "border-right-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-right-color"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "br",
                    "border-right"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "br",
                    "border-right"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-right-color"
                ]
            }
        ]
    },
    {
        "id": "border-top-color",
        "name": "border-top-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "border-top-color"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "bt",
                    "border-top"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "bt",
                    "border-top"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "border-top-color"
                ]
            }
        ]
    },
    {
        "id": "outline-color",
        "name": "outline-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color-line",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "outline-color"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "outline"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "outline"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "outline-color"
                ]
            }
        ]
    },
    {
        "id": "text-decoration-color",
        "name": "text-decoration-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color-text",
            "~color"
        ],
        "emit": {
            "type": "property",
            "property": "text-decoration-color"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "text-decoration"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text-decoration"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "text-decoration-color"
                ]
            }
        ]
    },
    {
        "id": "text-fill-color",
        "name": "text-fill-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color-text",
            "~color"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "-webkit-text-fill-color"
            ]
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
                    "text-fill-color"
                ]
            }
        ]
    },
    {
        "id": "text-stroke-color",
        "name": "text-stroke-color",
        "type": UtilityType.Native,
        "kind": "color",
        "variableAliasRefs": [
            "~color"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "-webkit-text-stroke-color"
            ]
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "text-stroke"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text-stroke"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "text-stroke-color"
                ]
            }
        ]
    },
    {
        "id": "mask-position",
        "name": "mask-position",
        "type": UtilityType.Native,
        "values": [
            "top",
            "bottom",
            "right",
            "left",
            "center"
        ],
        "unit": "px",
        "emit": {
            "type": "property",
            "property": "mask-position"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "mask-position"
                ]
            }
        ]
    },
    {
        "id": "mask-size",
        "name": "mask-size",
        "type": UtilityType.Native,
        "values": [
            "auto",
            "cover",
            "contain"
        ],
        "unit": "rem",
        "variableAliasRefs": [
            "~container"
        ],
        "emit": {
            "type": "property",
            "property": "mask-size"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "mask-size"
                ]
            }
        ]
    },
    {
        "id": "perspective",
        "name": "perspective",
        "type": UtilityType.Native,
        "values": [
            "none"
        ],
        "unit": "rem",
        "emit": {
            "type": "property",
            "property": "perspective"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "perspective"
                ]
            }
        ]
    },
    {
        "id": "perspective-origin",
        "name": "perspective-origin",
        "type": UtilityType.Native,
        "values": [
            "top",
            "bottom",
            "right",
            "left",
            "center"
        ],
        "kind": "number",
        "unit": "px",
        "emit": {
            "type": "property",
            "property": "perspective-origin"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "perspective-origin"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-block",
        "name": "scroll-margin-block",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-margin-block"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-block"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-block-end",
        "name": "scroll-margin-block-end",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-margin-block-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-block-end"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-block-start",
        "name": "scroll-margin-block-start",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-margin-block-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-block-start"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-inline",
        "name": "scroll-margin-inline",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-margin-inline"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-inline"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-inline-end",
        "name": "scroll-margin-inline-end",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-margin-inline-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-inline-end"
                ]
            }
        ]
    },
    {
        "id": "scroll-margin-inline-start",
        "name": "scroll-margin-inline-start",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-margin-inline-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-margin-inline-start"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-block",
        "name": "scroll-padding-block",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-padding-block"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-block"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-block-end",
        "name": "scroll-padding-block-end",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-padding-block-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-block-end"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-block-start",
        "name": "scroll-padding-block-start",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-padding-block-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-block-start"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-inline",
        "name": "scroll-padding-inline",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-padding-inline"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-inline"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-inline-end",
        "name": "scroll-padding-inline-end",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-padding-inline-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-inline-end"
                ]
            }
        ]
    },
    {
        "id": "scroll-padding-inline-start",
        "name": "scroll-padding-inline-start",
        "type": UtilityType.Native,
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "property",
            "property": "scroll-padding-inline-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-padding-inline-start"
                ]
            }
        ]
    },
    {
        "id": "blur()",
        "name": "blur()",
        "type": UtilityType.Normal,
        "key": "blur()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "filter"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "blur"
            }
        ]
    },
    {
        "id": "brightness()",
        "name": "brightness()",
        "type": UtilityType.Normal,
        "key": "brightness()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "filter"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "brightness"
            }
        ]
    },
    {
        "id": "contrast()",
        "name": "contrast()",
        "type": UtilityType.Normal,
        "key": "contrast()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "filter"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "contrast"
            }
        ]
    },
    {
        "id": "drop-shadow()",
        "name": "drop-shadow()",
        "type": UtilityType.Normal,
        "key": "drop-shadow()",
        "variableAliasRefs": [
            "~color"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "filter"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "drop-shadow"
            }
        ]
    },
    {
        "id": "gradient()",
        "name": "gradient()",
        "type": UtilityType.Normal,
        "key": "gradient()",
        "variableAliasRefs": [
            "~color"
        ],
        "emit": {
            "type": "template",
            "declarations": {
                "background-image": [
                    "linear-",
                    null
                ]
            }
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "gradient"
            }
        ]
    },
    {
        "id": "grayscale()",
        "name": "grayscale()",
        "type": UtilityType.Normal,
        "key": "grayscale()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "filter"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "grayscale"
            }
        ]
    },
    {
        "id": "hue-rotate()",
        "name": "hue-rotate()",
        "type": UtilityType.Normal,
        "key": "hue-rotate()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "filter"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "hue-rotate"
            }
        ]
    },
    {
        "id": "invert()",
        "name": "invert()",
        "type": UtilityType.Normal,
        "key": "invert()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "filter"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "invert"
            }
        ]
    },
    {
        "id": "matrix()",
        "name": "matrix()",
        "type": UtilityType.Normal,
        "key": "matrix()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "matrix"
            }
        ]
    },
    {
        "id": "matrix3d()",
        "name": "matrix3d()",
        "type": UtilityType.Normal,
        "key": "matrix3d()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "matrix3d"
            }
        ]
    },
    {
        "id": "opacity()",
        "name": "opacity()",
        "type": UtilityType.Normal,
        "key": "opacity()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "filter"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "opacity"
            }
        ]
    },
    {
        "id": "perspective()",
        "name": "perspective()",
        "type": UtilityType.Normal,
        "key": "perspective()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "perspective"
            }
        ]
    },
    {
        "id": "rotate()",
        "name": "rotate()",
        "type": UtilityType.Normal,
        "key": "rotate()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "rotate"
            }
        ]
    },
    {
        "id": "rotate3d()",
        "name": "rotate3d()",
        "type": UtilityType.Normal,
        "key": "rotate3d()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "rotate3d"
            }
        ]
    },
    {
        "id": "rotateX()",
        "name": "rotateX()",
        "type": UtilityType.Normal,
        "key": "rotateX()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "rotateX"
            }
        ]
    },
    {
        "id": "rotateY()",
        "name": "rotateY()",
        "type": UtilityType.Normal,
        "key": "rotateY()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "rotateY"
            }
        ]
    },
    {
        "id": "rotateZ()",
        "name": "rotateZ()",
        "type": UtilityType.Normal,
        "key": "rotateZ()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "rotateZ"
            }
        ]
    },
    {
        "id": "saturate()",
        "name": "saturate()",
        "type": UtilityType.Normal,
        "key": "saturate()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "filter"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "saturate"
            }
        ]
    },
    {
        "id": "scale()",
        "name": "scale()",
        "type": UtilityType.Normal,
        "key": "scale()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "scale"
            }
        ]
    },
    {
        "id": "scale3d()",
        "name": "scale3d()",
        "type": UtilityType.Normal,
        "key": "scale3d()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "scale3d"
            }
        ]
    },
    {
        "id": "scaleX()",
        "name": "scaleX()",
        "type": UtilityType.Normal,
        "key": "scaleX()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "scaleX"
            }
        ]
    },
    {
        "id": "scaleY()",
        "name": "scaleY()",
        "type": UtilityType.Normal,
        "key": "scaleY()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "scaleY"
            }
        ]
    },
    {
        "id": "scaleZ()",
        "name": "scaleZ()",
        "type": UtilityType.Normal,
        "key": "scaleZ()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "scaleZ"
            }
        ]
    },
    {
        "id": "sepia()",
        "name": "sepia()",
        "type": UtilityType.Normal,
        "key": "sepia()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "filter"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "sepia"
            }
        ]
    },
    {
        "id": "skew()",
        "name": "skew()",
        "type": UtilityType.Normal,
        "key": "skew()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "skew"
            }
        ]
    },
    {
        "id": "skewX()",
        "name": "skewX()",
        "type": UtilityType.Normal,
        "key": "skewX()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "skewX"
            }
        ]
    },
    {
        "id": "skewY()",
        "name": "skewY()",
        "type": UtilityType.Normal,
        "key": "skewY()",
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "skewY"
            }
        ]
    },
    {
        "id": "translate()",
        "name": "translate()",
        "type": UtilityType.Normal,
        "key": "translate()",
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "translate"
            }
        ]
    },
    {
        "id": "translate3d()",
        "name": "translate3d()",
        "type": UtilityType.Normal,
        "key": "translate3d()",
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "translate3d"
            }
        ]
    },
    {
        "id": "translateX()",
        "name": "translateX()",
        "type": UtilityType.Normal,
        "key": "translateX()",
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "translateX"
            }
        ]
    },
    {
        "id": "translateY()",
        "name": "translateY()",
        "type": UtilityType.Normal,
        "key": "translateY()",
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "translateY"
            }
        ]
    },
    {
        "id": "translateZ()",
        "name": "translateZ()",
        "type": UtilityType.Normal,
        "key": "translateZ()",
        "unit": "rem",
        "variableAliasRefs": [
            "~spacing"
        ],
        "emit": {
            "type": "declarations",
            "declarations": [
                "transform"
            ]
        },
        "matchers": [
            {
                "type": "function-prefix",
                "name": "translateZ"
            }
        ]
    }
] satisfies PresetUtilitySource[]

export default utilities
