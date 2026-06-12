import UtilityType from 'shared/utility-type'
import type { MasterCSSPlanUtility } from 'shared/master-css-plan'

export type PresetUtilitySource = Omit<MasterCSSPlanUtility, 'order'>

const utilities = [
    {
        "id": ".abs",
        "name": "abs",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "position": "absolute"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "abs"
            }
        ]
    },
    {
        "id": ".bg-clip-border",
        "name": "bg-clip-border",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "background-clip": "border-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "bg-clip-border"
            }
        ]
    },
    {
        "id": ".bg-clip-content",
        "name": "bg-clip-content",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "background-clip": "content-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "bg-clip-content"
            }
        ]
    },
    {
        "id": ".bg-clip-padding",
        "name": "bg-clip-padding",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "background-clip": "padding-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "bg-clip-padding"
            }
        ]
    },
    {
        "id": ".bg-clip-text",
        "name": "bg-clip-text",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "background-clip": "text"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "bg-clip-text"
            }
        ]
    },
    {
        "id": ".bg-origin-border",
        "name": "bg-origin-border",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "background-origin": "border-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "bg-origin-border"
            }
        ]
    },
    {
        "id": ".bg-origin-content",
        "name": "bg-origin-content",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "background-origin": "content-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "bg-origin-content"
            }
        ]
    },
    {
        "id": ".bg-origin-padding",
        "name": "bg-origin-padding",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "background-origin": "padding-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "bg-origin-padding"
            }
        ]
    },
    {
        "id": ".block",
        "name": "block",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "block"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "block"
            }
        ]
    },
    {
        "id": ".bottom",
        "name": "bottom",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "bottom": 0
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "bottom"
            }
        ]
    },
    {
        "id": ".box-border",
        "name": "box-border",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "box-sizing": "border-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "box-border"
            }
        ]
    },
    {
        "id": ".box-content",
        "name": "box-content",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "box-sizing": "content-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "box-content"
            }
        ]
    },
    {
        "id": ".break-spaces",
        "name": "break-spaces",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "white-space": "break-spaces"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "break-spaces"
            }
        ]
    },
    {
        "id": ".break-word",
        "name": "break-word",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "word-break": "break-word"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "break-word"
            }
        ]
    },
    {
        "id": ".capitalize",
        "name": "capitalize",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "text-transform": "capitalize"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "capitalize"
            }
        ]
    },
    {
        "id": ".center",
        "name": "center",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "left": 0,
                        "right": 0,
                        "margin-left": "auto",
                        "margin-right": "auto"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "center"
            }
        ]
    },
    {
        "id": ".clip-border",
        "name": "clip-border",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "clip-path": "border-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "clip-border"
            }
        ]
    },
    {
        "id": ".clip-content",
        "name": "clip-content",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "clip-path": "content-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "clip-content"
            }
        ]
    },
    {
        "id": ".clip-fill",
        "name": "clip-fill",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "clip-path": "fill-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "clip-fill"
            }
        ]
    },
    {
        "id": ".clip-margin",
        "name": "clip-margin",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "clip-path": "margin-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "clip-margin"
            }
        ]
    },
    {
        "id": ".clip-none",
        "name": "clip-none",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "clip-path": "none"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "clip-none"
            }
        ]
    },
    {
        "id": ".clip-padding",
        "name": "clip-padding",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "clip-path": "padding-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "clip-padding"
            }
        ]
    },
    {
        "id": ".clip-stroke",
        "name": "clip-stroke",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "clip-path": "stroke-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "clip-stroke"
            }
        ]
    },
    {
        "id": ".clip-view",
        "name": "clip-view",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "clip-path": "view-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "clip-view"
            }
        ]
    },
    {
        "id": ".container",
        "name": "container",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "container-type": "inline-size"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "container"
            }
        ]
    },
    {
        "id": ".content-around",
        "name": "content-around",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-content": "space-around"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "content-around"
            }
        ]
    },
    {
        "id": ".content-baseline",
        "name": "content-baseline",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-content": "baseline"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "content-baseline"
            }
        ]
    },
    {
        "id": ".content-between",
        "name": "content-between",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-content": "space-between"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "content-between"
            }
        ]
    },
    {
        "id": ".content-center",
        "name": "content-center",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-content": "center"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "content-center"
            }
        ]
    },
    {
        "id": ".content-end",
        "name": "content-end",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-content": "end"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "content-end"
            }
        ]
    },
    {
        "id": ".content-evenly",
        "name": "content-evenly",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-content": "space-evenly"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "content-evenly"
            }
        ]
    },
    {
        "id": ".content-flex-end",
        "name": "content-flex-end",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-content": "flex-end"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "content-flex-end"
            }
        ]
    },
    {
        "id": ".content-flex-start",
        "name": "content-flex-start",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-content": "flex-start"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "content-flex-start"
            }
        ]
    },
    {
        "id": ".content-normal",
        "name": "content-normal",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-content": "normal"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "content-normal"
            }
        ]
    },
    {
        "id": ".content-start",
        "name": "content-start",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-content": "start"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "content-start"
            }
        ]
    },
    {
        "id": ".content-stretch",
        "name": "content-stretch",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-content": "stretch"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "content-stretch"
            }
        ]
    },
    {
        "id": ".contents",
        "name": "contents",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "contents"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "contents"
            }
        ]
    },
    {
        "id": ".fit",
        "name": "fit",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "width": "fit-content",
                        "height": "fit-content"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "fit"
            }
        ]
    },
    {
        "id": ".fixed",
        "name": "fixed",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "position": "fixed"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "fixed"
            }
        ]
    },
    {
        "id": ".flex",
        "name": "flex",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "flex"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "flex"
            }
        ]
    },
    {
        "id": ".flex-col",
        "name": "flex-col",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "flex-direction": "column"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "flex-col"
            }
        ]
    },
    {
        "id": ".flex-col-reverse",
        "name": "flex-col-reverse",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "flex-direction": "column-reverse"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "flex-col-reverse"
            }
        ]
    },
    {
        "id": ".flex-row",
        "name": "flex-row",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "flex-direction": "row"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "flex-row"
            }
        ]
    },
    {
        "id": ".flex-row-reverse",
        "name": "flex-row-reverse",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "flex-direction": "row-reverse"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "flex-row-reverse"
            }
        ]
    },
    {
        "id": ".flow-root",
        "name": "flow-root",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "flow-root"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "flow-root"
            }
        ]
    },
    {
        "id": ".font-antialiased",
        "name": "font-antialiased",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "-webkit-font-smoothing": "antialiased",
                        "-moz-osx-font-smoothing": "grayscale"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "font-antialiased"
            }
        ]
    },
    {
        "id": ".font-subpixel-antialiased",
        "name": "font-subpixel-antialiased",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "-webkit-font-smoothing": "auto",
                        "-moz-osx-font-smoothing": "auto"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "font-subpixel-antialiased"
            }
        ]
    },
    {
        "id": ".full",
        "name": "full",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "width": "100%",
                        "height": "100%"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "full"
            }
        ]
    },
    {
        "id": ".gradient-text",
        "name": "gradient-text",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "-webkit-text-fill-color": "transparent",
                        "background-clip": "text"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "gradient-text"
            }
        ]
    },
    {
        "id": ".grid",
        "name": "grid",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "grid"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "grid"
            }
        ]
    },
    {
        "id": ".hidden",
        "name": "hidden",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "none"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "hidden"
            }
        ]
    },
    {
        "id": ".inline",
        "name": "inline",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "inline"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "inline"
            }
        ]
    },
    {
        "id": ".inline-block",
        "name": "inline-block",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "inline-block"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "inline-block"
            }
        ]
    },
    {
        "id": ".inline-flex",
        "name": "inline-flex",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "inline-flex"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "inline-flex"
            }
        ]
    },
    {
        "id": ".inline-grid",
        "name": "inline-grid",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "inline-grid"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "inline-grid"
            }
        ]
    },
    {
        "id": ".inline-table",
        "name": "inline-table",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "inline-table"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "inline-table"
            }
        ]
    },
    {
        "id": ".invisible",
        "name": "invisible",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "visibility": "hidden"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "invisible"
            }
        ]
    },
    {
        "id": ".isolate",
        "name": "isolate",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "isolation": "isolate"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "isolate"
            }
        ]
    },
    {
        "id": ".italic",
        "name": "italic",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "font-style": "italic"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "italic"
            }
        ]
    },
    {
        "id": ".items-baseline",
        "name": "items-baseline",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-items": "baseline"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "items-baseline"
            }
        ]
    },
    {
        "id": ".items-center",
        "name": "items-center",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-items": "center"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "items-center"
            }
        ]
    },
    {
        "id": ".items-end",
        "name": "items-end",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-items": "end"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "items-end"
            }
        ]
    },
    {
        "id": ".items-flex-end",
        "name": "items-flex-end",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-items": "flex-end"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "items-flex-end"
            }
        ]
    },
    {
        "id": ".items-flex-start",
        "name": "items-flex-start",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-items": "flex-start"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "items-flex-start"
            }
        ]
    },
    {
        "id": ".items-normal",
        "name": "items-normal",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-items": "normal"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "items-normal"
            }
        ]
    },
    {
        "id": ".items-self-end",
        "name": "items-self-end",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-items": "self-end"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "items-self-end"
            }
        ]
    },
    {
        "id": ".items-self-start",
        "name": "items-self-start",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-items": "self-start"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "items-self-start"
            }
        ]
    },
    {
        "id": ".items-start",
        "name": "items-start",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-items": "start"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "items-start"
            }
        ]
    },
    {
        "id": ".items-stretch",
        "name": "items-stretch",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-items": "stretch"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "items-stretch"
            }
        ]
    },
    {
        "id": ".justify-around",
        "name": "justify-around",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "space-around"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-around"
            }
        ]
    },
    {
        "id": ".justify-between",
        "name": "justify-between",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "space-between"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-between"
            }
        ]
    },
    {
        "id": ".justify-center",
        "name": "justify-center",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "center"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-center"
            }
        ]
    },
    {
        "id": ".justify-end",
        "name": "justify-end",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "end"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-end"
            }
        ]
    },
    {
        "id": ".justify-evenly",
        "name": "justify-evenly",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "space-evenly"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-evenly"
            }
        ]
    },
    {
        "id": ".justify-flex-end",
        "name": "justify-flex-end",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "flex-end"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-flex-end"
            }
        ]
    },
    {
        "id": ".justify-flex-start",
        "name": "justify-flex-start",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "flex-start"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-flex-start"
            }
        ]
    },
    {
        "id": ".justify-left",
        "name": "justify-left",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "left"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-left"
            }
        ]
    },
    {
        "id": ".justify-normal",
        "name": "justify-normal",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "normal"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-normal"
            }
        ]
    },
    {
        "id": ".justify-right",
        "name": "justify-right",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "right"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-right"
            }
        ]
    },
    {
        "id": ".justify-start",
        "name": "justify-start",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "start"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-start"
            }
        ]
    },
    {
        "id": ".justify-stretch",
        "name": "justify-stretch",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "justify-content": "stretch"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "justify-stretch"
            }
        ]
    },
    {
        "id": ".left",
        "name": "left",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "left": 0
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "left"
            }
        ]
    },
    {
        "id": ".list-item",
        "name": "list-item",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "list-item"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "list-item"
            }
        ]
    },
    {
        "id": ".lowercase",
        "name": "lowercase",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "text-transform": "lowercase"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "lowercase"
            }
        ]
    },
    {
        "id": ".max-vh",
        "name": "max-vh",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "max-height": "100vh"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "max-vh"
            }
        ]
    },
    {
        "id": ".max-vw",
        "name": "max-vw",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "max-width": "100vw"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "max-vw"
            }
        ]
    },
    {
        "id": ".middle",
        "name": "middle",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "top": 0,
                        "bottom": 0,
                        "margin-top": "auto",
                        "margin-bottom": "auto"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "middle"
            }
        ]
    },
    {
        "id": ".min-vh",
        "name": "min-vh",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "min-height": "100vh"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "min-vh"
            }
        ]
    },
    {
        "id": ".min-vw",
        "name": "min-vw",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "min-width": "100vw"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "min-vw"
            }
        ]
    },
    {
        "id": ".oblique",
        "name": "oblique",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "font-style": "oblique"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "oblique"
            }
        ]
    },
    {
        "id": ".overflow",
        "name": "overflow",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "overflow": "visible"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "overflow"
            }
        ]
    },
    {
        "id": ".rel",
        "name": "rel",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "position": "relative"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "rel"
            }
        ]
    },
    {
        "id": ".right",
        "name": "right",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "right": 0
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "right"
            }
        ]
    },
    {
        "id": ".round",
        "name": "round",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "border-radius": "50%",
                        "aspect-ratio": "1/1"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "round"
            }
        ]
    },
    {
        "id": ".rounded",
        "name": "rounded",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "border-radius": "1e9em"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "rounded"
            }
        ]
    },
    {
        "id": ".self-anchor-center",
        "name": "self-anchor-center",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "anchor-center"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-anchor-center"
            }
        ]
    },
    {
        "id": ".self-auto",
        "name": "self-auto",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "auto"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-auto"
            }
        ]
    },
    {
        "id": ".self-baseline",
        "name": "self-baseline",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "baseline"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-baseline"
            }
        ]
    },
    {
        "id": ".self-center",
        "name": "self-center",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "center"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-center"
            }
        ]
    },
    {
        "id": ".self-end",
        "name": "self-end",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "end"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-end"
            }
        ]
    },
    {
        "id": ".self-flex-end",
        "name": "self-flex-end",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "flex-end"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-flex-end"
            }
        ]
    },
    {
        "id": ".self-flex-start",
        "name": "self-flex-start",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "flex-start"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-flex-start"
            }
        ]
    },
    {
        "id": ".self-normal",
        "name": "self-normal",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "normal"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-normal"
            }
        ]
    },
    {
        "id": ".self-self-end",
        "name": "self-self-end",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "self-end"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-self-end"
            }
        ]
    },
    {
        "id": ".self-self-start",
        "name": "self-self-start",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "self-start"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-self-start"
            }
        ]
    },
    {
        "id": ".self-start",
        "name": "self-start",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "start"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-start"
            }
        ]
    },
    {
        "id": ".self-stretch",
        "name": "self-stretch",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "align-self": "stretch"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "self-stretch"
            }
        ]
    },
    {
        "id": ".shape-border",
        "name": "shape-border",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "shape-outside": "border-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "shape-border"
            }
        ]
    },
    {
        "id": ".shape-content",
        "name": "shape-content",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "shape-outside": "content-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "shape-content"
            }
        ]
    },
    {
        "id": ".shape-margin",
        "name": "shape-margin",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "shape-outside": "margin-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "shape-margin"
            }
        ]
    },
    {
        "id": ".shape-none",
        "name": "shape-none",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "shape-outside": "none"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "shape-none"
            }
        ]
    },
    {
        "id": ".shape-padding",
        "name": "shape-padding",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "shape-outside": "padding-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "shape-padding"
            }
        ]
    },
    {
        "id": ".square",
        "name": "square",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "aspect-ratio": "1/1"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "square"
            }
        ]
    },
    {
        "id": ".sr-only",
        "name": "sr-only",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "position": "absolute",
                        "width": "1px",
                        "height": "1px",
                        "padding": "0",
                        "margin": "-1px",
                        "overflow": "hidden",
                        "clip": "rect(0,0,0,0)",
                        "white-space": "nowrap",
                        "border-width": "0"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "sr-only"
            }
        ]
    },
    {
        "id": ".static",
        "name": "static",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "position": "static"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "static"
            }
        ]
    },
    {
        "id": ".sticky",
        "name": "sticky",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "position": "sticky"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "sticky"
            }
        ]
    },
    {
        "id": ".table",
        "name": "table",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "table"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "table"
            }
        ]
    },
    {
        "id": ".table-caption",
        "name": "table-caption",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "table-caption"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "table-caption"
            }
        ]
    },
    {
        "id": ".table-cell",
        "name": "table-cell",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "table-cell"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "table-cell"
            }
        ]
    },
    {
        "id": ".table-column",
        "name": "table-column",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "table-column"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "table-column"
            }
        ]
    },
    {
        "id": ".table-column-group",
        "name": "table-column-group",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "table-column-group"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "table-column-group"
            }
        ]
    },
    {
        "id": ".table-footer-group",
        "name": "table-footer-group",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "table-footer-group"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "table-footer-group"
            }
        ]
    },
    {
        "id": ".table-header-group",
        "name": "table-header-group",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "table-header-group"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "table-header-group"
            }
        ]
    },
    {
        "id": ".table-row",
        "name": "table-row",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "table-row"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "table-row"
            }
        ]
    },
    {
        "id": ".table-row-group",
        "name": "table-row-group",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "display": "table-row-group"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "table-row-group"
            }
        ]
    },
    {
        "id": ".top",
        "name": "top",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "top": 0
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "top"
            }
        ]
    },
    {
        "id": ".transform-border",
        "name": "transform-border",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "transform-box": "border-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "transform-border"
            }
        ]
    },
    {
        "id": ".transform-content",
        "name": "transform-content",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "transform-box": "content-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "transform-content"
            }
        ]
    },
    {
        "id": ".transform-fill",
        "name": "transform-fill",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "transform-box": "fill-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "transform-fill"
            }
        ]
    },
    {
        "id": ".transform-stroke",
        "name": "transform-stroke",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "transform-box": "stroke-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "transform-stroke"
            }
        ]
    },
    {
        "id": ".transform-view",
        "name": "transform-view",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "transform-box": "view-box"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "transform-view"
            }
        ]
    },
    {
        "id": ".untouchable",
        "name": "untouchable",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "pointer-events": "none"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "untouchable"
            }
        ]
    },
    {
        "id": ".uppercase",
        "name": "uppercase",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "text-transform": "uppercase"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "uppercase"
            }
        ]
    },
    {
        "id": ".vh",
        "name": "vh",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "height": "100vh"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "vh"
            }
        ]
    },
    {
        "id": ".video",
        "name": "video",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "aspect-ratio": "16/9"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "video"
            }
        ]
    },
    {
        "id": ".visible",
        "name": "visible",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "visibility": "visible"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "visible"
            }
        ]
    },
    {
        "id": ".vw",
        "name": "vw",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "width": "100vw"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "vw"
            }
        ]
    },
    {
        "id": ".wrap-anywhere",
        "name": "wrap-anywhere",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "overflow-wrap": "anywhere"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "wrap-anywhere"
            }
        ]
    },
    {
        "id": ".wrap-break-word",
        "name": "wrap-break-word",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "overflow-wrap": "break-word"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "wrap-break-word"
            }
        ]
    },
    {
        "id": ".wrap-normal",
        "name": "wrap-normal",
        "type": UtilityType.Static,
        "emit": {
            "type": "static",
            "rules": [
                {
                    "declarations": {
                        "overflow-wrap": "normal"
                    }
                }
            ]
        },
        "matchers": [
            {
                "type": "static",
                "name": "wrap-normal"
            }
        ]
    },
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
        "id": "border-block-style",
        "name": "border-block-style",
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
            "property": "border-block-style"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block-style"
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
        "id": "border-image",
        "name": "border-image",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "border-image"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-image"
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
        "id": "border-inline-style",
        "name": "border-inline-style",
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
            "property": "border-inline-style"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline-style"
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
                    "border-radius",
                    "r"
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
        "id": "columns",
        "name": "columns",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "columns"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "columns",
                    "cols"
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
        "id": "flex",
        "name": "flex",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "flex"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "flex"
                ]
            }
        ]
    },
    {
        "id": "font",
        "name": "font",
        "type": UtilityType.NativeShorthand,
        "variableAliasRefs": [
            "=font",
            "~font-family",
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
                    "font",
                    "f"
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
                    "font",
                    "f"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font",
                    "f"
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
        "id": "grid",
        "name": "grid",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "grid"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid"
                ]
            }
        ]
    },
    {
        "id": "grid-area",
        "name": "grid-area",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "grid-area"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-area"
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
        "id": "grid-row",
        "name": "grid-row",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "grid-row"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-row"
                ]
            }
        ]
    },
    {
        "id": "grid-template",
        "name": "grid-template",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "grid-template"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-template"
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
                    "inset-block",
                    "ib"
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
                    "inset-inline",
                    "ii"
                ]
            }
        ]
    },
    {
        "id": "list-style",
        "name": "list-style",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "list-style"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "list-style"
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
                    "margin",
                    "m"
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
                    "margin-inline",
                    "mi"
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
        "id": "overflow",
        "name": "overflow",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "overflow"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "overflow"
                ]
            }
        ]
    },
    {
        "id": "overscroll-behavior",
        "name": "overscroll-behavior",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "overscroll-behavior"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "overscroll-behavior"
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
                    "padding",
                    "p"
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
                    "padding-inline",
                    "pi"
                ]
            }
        ]
    },
    {
        "id": "place-content",
        "name": "place-content",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "place-content"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "place-content"
                ]
            }
        ]
    },
    {
        "id": "place-items",
        "name": "place-items",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "place-items"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "place-items"
                ]
            }
        ]
    },
    {
        "id": "place-self",
        "name": "place-self",
        "type": UtilityType.NativeShorthand,
        "emit": {
            "type": "property",
            "property": "place-self"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "place-self"
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
                    "scroll-margin",
                    "scroll-m"
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
                    "scroll-padding",
                    "scroll-p"
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
                    "text",
                    "t"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text",
                    "t"
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
                    "text",
                    "t"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text",
                    "t"
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
                    "rb",
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
                    "rl",
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
                    "rr",
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
                    "rt",
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
                    "mx",
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
                    "my",
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
                    "max",
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
                    "min",
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
                    "px",
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
                    "py",
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
                    "scroll-mx",
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
                    "scroll-my",
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
                    "scroll-px",
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
                    "scroll-py",
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
                    "text",
                    "t"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text",
                    "t"
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
                    "accent-color",
                    "accent"
                ]
            }
        ]
    },
    {
        "id": "align-content",
        "name": "align-content",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "align-content"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "align-content",
                    "ac"
                ]
            }
        ]
    },
    {
        "id": "align-items",
        "name": "align-items",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "align-items"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "align-items",
                    "ai"
                ]
            }
        ]
    },
    {
        "id": "align-self",
        "name": "align-self",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "align-self"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "align-self",
                    "as"
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
        "id": "animation-direction",
        "name": "animation-direction",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "animation-direction"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "animation-direction"
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
        "id": "animation-fill-mode",
        "name": "animation-fill-mode",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "animation-fill-mode"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "animation-fill-mode"
                ]
            }
        ]
    },
    {
        "id": "animation-iteration-count",
        "name": "animation-iteration-count",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "animation-iteration-count"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "animation-iteration-count"
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
        "id": "animation-play-state",
        "name": "animation-play-state",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "animation-play-state"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "animation-play-state"
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
        "id": "appearance",
        "name": "appearance",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "appearance"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "appearance"
                ]
            }
        ]
    },
    {
        "id": "aspect-ratio",
        "name": "aspect-ratio",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "aspect-ratio"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "aspect-ratio",
                    "aspect"
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
                    "backdrop-filter",
                    "bd"
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
        "id": "background-blend-mode",
        "name": "background-blend-mode",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "background-blend-mode"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "background-blend-mode",
                    "bg-blend"
                ]
            }
        ]
    },
    {
        "id": "background-clip",
        "name": "background-clip",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "background-clip"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "background-clip",
                    "bg-clip"
                ]
            }
        ]
    },
    {
        "id": "background-origin",
        "name": "background-origin",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "background-origin"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "background-origin",
                    "bg-origin"
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
                    "block-size",
                    "bs"
                ]
            }
        ]
    },
    {
        "id": "border-block-end-style",
        "name": "border-block-end-style",
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
            "property": "border-block-end-style"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block-end-style"
                ]
            }
        ]
    },
    {
        "id": "border-block-start-style",
        "name": "border-block-start-style",
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
            "property": "border-block-start-style"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-block-start-style"
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
                    "border-bottom-left-radius",
                    "rbl"
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
                    "border-bottom-right-radius",
                    "rbr"
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
        "id": "border-image-slice",
        "name": "border-image-slice",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "border-image-slice"
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
                    "border-image-slice"
                ]
            }
        ]
    },
    {
        "id": "border-inline-end-style",
        "name": "border-inline-end-style",
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
            "property": "border-inline-end-style"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline-end-style"
                ]
            }
        ]
    },
    {
        "id": "border-inline-start-style",
        "name": "border-inline-start-style",
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
            "property": "border-inline-start-style"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "border-inline-start-style"
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
                    "border-top-left-radius",
                    "rtl"
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
                    "border-top-right-radius",
                    "rtr"
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
                    "box-decoration-break",
                    "box-decoration"
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
                    "box-shadow",
                    "shadow",
                    "s"
                ]
            }
        ]
    },
    {
        "id": "box-sizing",
        "name": "box-sizing",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "box-sizing"
        },
        "matchers": [
            {
                "type": "variable",
                "keys": [
                    "box"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "box"
                ]
            },
            {
                "type": "key",
                "keys": [
                    "box-sizing"
                ]
            }
        ]
    },
    {
        "id": "break-after",
        "name": "break-after",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "break-after"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "break-after"
                ]
            }
        ]
    },
    {
        "id": "break-before",
        "name": "break-before",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "break-before"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "break-before"
                ]
            }
        ]
    },
    {
        "id": "break-inside",
        "name": "break-inside",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "break-inside"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "break-inside"
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
                    "caret-color",
                    "caret"
                ]
            }
        ]
    },
    {
        "id": "clear",
        "name": "clear",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "clear"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "clear"
                ]
            }
        ]
    },
    {
        "id": "clip-path",
        "name": "clip-path",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "clip-path"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "clip-path",
                    "clip"
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
                    "color",
                    "fg"
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
                    "column-gap",
                    "gap-x"
                ]
            }
        ]
    },
    {
        "id": "column-span",
        "name": "column-span",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "column-span"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "column-span",
                    "col-span"
                ]
            }
        ]
    },
    {
        "id": "contain",
        "name": "contain",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "contain"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "contain"
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
        "id": "container-name",
        "name": "container-name",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "container-name"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "container-name"
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
        "id": "content",
        "name": "content",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "content"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "content"
                ]
            }
        ]
    },
    {
        "id": "counter-increment",
        "name": "counter-increment",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "counter-increment"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "counter-increment"
                ]
            }
        ]
    },
    {
        "id": "counter-reset",
        "name": "counter-reset",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "counter-reset"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "counter-reset"
                ]
            }
        ]
    },
    {
        "id": "counter-set",
        "name": "counter-set",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "counter-set"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "counter-set"
                ]
            }
        ]
    },
    {
        "id": "cursor",
        "name": "cursor",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "cursor"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "cursor"
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
        "id": "direction",
        "name": "direction",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "direction"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "direction"
                ]
            }
        ]
    },
    {
        "id": "display",
        "name": "display",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "display"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "display",
                    "d"
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
        "id": "flex-grow",
        "name": "flex-grow",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "flex-grow"
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
                    "flex-grow"
                ]
            }
        ]
    },
    {
        "id": "flex-shrink",
        "name": "flex-shrink",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "flex-shrink"
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
                    "flex-shrink"
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
        "id": "float",
        "name": "float",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "float"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "float"
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
                    "font",
                    "f"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font",
                    "f"
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
        "emit": {
            "type": "property",
            "property": "font-feature-settings"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "font-feature-settings",
                    "font-feature"
                ]
            }
        ]
    },
    {
        "id": "font-smooth",
        "name": "font-smooth",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "font-smooth"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "font-smooth"
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
                    "font",
                    "f"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font",
                    "f"
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
                    "font",
                    "f"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font",
                    "f"
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
                    "font",
                    "f"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font",
                    "f"
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
        "id": "grid-auto-columns",
        "name": "grid-auto-columns",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "grid-auto-columns"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-auto-columns",
                    "grid-auto-cols"
                ]
            }
        ]
    },
    {
        "id": "grid-auto-flow",
        "name": "grid-auto-flow",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "grid-auto-flow"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-auto-flow",
                    "grid-flow"
                ]
            }
        ]
    },
    {
        "id": "grid-auto-rows",
        "name": "grid-auto-rows",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "grid-auto-rows"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-auto-rows"
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
        "id": "grid-row-end",
        "name": "grid-row-end",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "grid-row-end"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-row-end"
                ]
            }
        ]
    },
    {
        "id": "grid-row-start",
        "name": "grid-row-start",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "grid-row-start"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-row-start"
                ]
            }
        ]
    },
    {
        "id": "grid-template-areas",
        "name": "grid-template-areas",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "grid-template-areas"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "grid-template-areas"
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
                    "grid-template-columns",
                    "grid-template-cols"
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
                    "height",
                    "h"
                ]
            }
        ]
    },
    {
        "id": "hyphens",
        "name": "hyphens",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "hyphens"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "hyphens"
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
                    "inline-size",
                    "is"
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
                    "inset-block-end",
                    "ibe"
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
                    "inset-block-start",
                    "ibs"
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
                    "inset-inline-end",
                    "iie"
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
                    "inset-inline-start",
                    "iis"
                ]
            }
        ]
    },
    {
        "id": "isolation",
        "name": "isolation",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "isolation"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "isolation"
                ]
            }
        ]
    },
    {
        "id": "justify-content",
        "name": "justify-content",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "justify-content"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "justify-content",
                    "jc"
                ]
            }
        ]
    },
    {
        "id": "justify-items",
        "name": "justify-items",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "justify-items"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "justify-items",
                    "ji"
                ]
            }
        ]
    },
    {
        "id": "justify-self",
        "name": "justify-self",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "justify-self"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "justify-self",
                    "js"
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
                    "letter-spacing",
                    "tracking",
                    "ls"
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
                    "line-height",
                    "leading",
                    "line-h"
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
                    "margin-block-end",
                    "mbe"
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
                    "margin-block-start",
                    "mbs"
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
                    "margin-bottom",
                    "mb"
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
                    "margin-inline-end",
                    "mie"
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
                    "margin-inline-start",
                    "mis"
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
                    "margin-left",
                    "ml"
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
                    "margin-right",
                    "mr"
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
                    "margin-top",
                    "mt"
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
                    "max-block-size",
                    "max-bs"
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
                    "max-height",
                    "max-h"
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
                    "max-inline-size",
                    "max-is"
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
                    "max-width",
                    "max-w"
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
                    "min-block-size",
                    "min-bs"
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
                    "min-height",
                    "min-h"
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
                    "min-inline-size",
                    "min-is"
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
                    "min-width",
                    "min-w"
                ]
            }
        ]
    },
    {
        "id": "mix-blend-mode",
        "name": "mix-blend-mode",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "mix-blend-mode"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "mix-blend-mode",
                    "blend"
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
                    "object",
                    "obj"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "object",
                    "obj"
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
                    "object",
                    "obj"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "object",
                    "obj"
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
        "id": "opacity",
        "name": "opacity",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "opacity"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "opacity"
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
                    "order",
                    "o"
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
        "id": "overflow-block",
        "name": "overflow-block",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "overflow-block"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "overflow-block"
                ]
            }
        ]
    },
    {
        "id": "overflow-inline",
        "name": "overflow-inline",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "overflow-inline"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "overflow-inline"
                ]
            }
        ]
    },
    {
        "id": "overflow-wrap",
        "name": "overflow-wrap",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "overflow-wrap"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "overflow-wrap"
                ]
            }
        ]
    },
    {
        "id": "overflow-x",
        "name": "overflow-x",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "overflow-x"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "overflow-x"
                ]
            }
        ]
    },
    {
        "id": "overflow-y",
        "name": "overflow-y",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "overflow-y"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "overflow-y"
                ]
            }
        ]
    },
    {
        "id": "overscroll-behavior-block",
        "name": "overscroll-behavior-block",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "overscroll-behavior-block"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "overscroll-behavior-block"
                ]
            }
        ]
    },
    {
        "id": "overscroll-behavior-inline",
        "name": "overscroll-behavior-inline",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "overscroll-behavior-inline"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "overscroll-behavior-inline"
                ]
            }
        ]
    },
    {
        "id": "overscroll-behavior-x",
        "name": "overscroll-behavior-x",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "overscroll-behavior-x"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "overscroll-behavior-x"
                ]
            }
        ]
    },
    {
        "id": "overscroll-behavior-y",
        "name": "overscroll-behavior-y",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "overscroll-behavior-y"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "overscroll-behavior-y"
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
                    "padding-block-end",
                    "pbe"
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
                    "padding-block-start",
                    "pbs"
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
                    "padding-bottom",
                    "pb"
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
                    "padding-inline-end",
                    "pie"
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
                    "padding-inline-start",
                    "pis"
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
                    "padding-left",
                    "pl"
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
                    "padding-right",
                    "pr"
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
                    "padding-top",
                    "pt"
                ]
            }
        ]
    },
    {
        "id": "pointer-events",
        "name": "pointer-events",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "pointer-events"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "pointer-events"
                ]
            }
        ]
    },
    {
        "id": "position",
        "name": "position",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "position"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "position"
                ]
            }
        ]
    },
    {
        "id": "quotes",
        "name": "quotes",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "quotes"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "quotes"
                ]
            }
        ]
    },
    {
        "id": "resize",
        "name": "resize",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "resize"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "resize"
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
                    "row-gap",
                    "gap-y"
                ]
            }
        ]
    },
    {
        "id": "rx",
        "name": "rx",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "rx"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "rx"
                ]
            }
        ]
    },
    {
        "id": "ry",
        "name": "ry",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "ry"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "ry"
                ]
            }
        ]
    },
    {
        "id": "scale",
        "name": "scale",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "scale"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scale"
                ]
            }
        ]
    },
    {
        "id": "scroll-behavior",
        "name": "scroll-behavior",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "scroll-behavior"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "scroll-behavior"
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
                    "scroll-margin-bottom",
                    "scroll-mb"
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
                    "scroll-margin-left",
                    "scroll-ml"
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
                    "scroll-margin-right",
                    "scroll-mr"
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
                    "scroll-margin-top",
                    "scroll-mt"
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
                    "scroll-padding-bottom",
                    "scroll-pb"
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
                    "scroll-padding-left",
                    "scroll-pl"
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
                    "scroll-padding-right",
                    "scroll-pr"
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
                    "scroll-padding-top",
                    "scroll-pt"
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
        "id": "shape-image-threshold",
        "name": "shape-image-threshold",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "shape-image-threshold"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "shape-image-threshold"
                ]
            }
        ]
    },
    {
        "id": "shape-outside",
        "name": "shape-outside",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "shape-outside"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "shape-outside",
                    "shape"
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
        "id": "stroke-dasharray",
        "name": "stroke-dasharray",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "stroke-dasharray"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "stroke-dasharray"
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
        "id": "tab-size",
        "name": "tab-size",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "tab-size"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "tab-size",
                    "tab"
                ]
            }
        ]
    },
    {
        "id": "table-layout",
        "name": "table-layout",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "table-layout"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "table-layout"
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
                    "text",
                    "t"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text",
                    "t"
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
                    "text",
                    "t"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text",
                    "t"
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
                    "text",
                    "t"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text",
                    "t"
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
                    "text",
                    "t"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text",
                    "t"
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
                    "text",
                    "t"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text",
                    "t"
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
        "id": "touch-action",
        "name": "touch-action",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "touch-action"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "touch-action",
                    "touch"
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
        "id": "transform-box",
        "name": "transform-box",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "transform-box"
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
                    "transform-box"
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
        "id": "transition-property",
        "name": "transition-property",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "transition-property"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "transition-property"
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
        "id": "vertical-align",
        "name": "vertical-align",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "vertical-align"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "vertical-align",
                    "v",
                    "vertical"
                ]
            }
        ]
    },
    {
        "id": "view-transition-class",
        "name": "view-transition-class",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "view-transition-class"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "view-transition-class",
                    "vt-class"
                ]
            }
        ]
    },
    {
        "id": "view-transition-name",
        "name": "view-transition-name",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "view-transition-name"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "view-transition-name",
                    "vt-name"
                ]
            }
        ]
    },
    {
        "id": "visibility",
        "name": "visibility",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "visibility"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "visibility"
                ]
            }
        ]
    },
    {
        "id": "white-space",
        "name": "white-space",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "white-space"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "white-space"
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
                    "width",
                    "w"
                ]
            }
        ]
    },
    {
        "id": "will-change",
        "name": "will-change",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "will-change"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "will-change"
                ]
            }
        ]
    },
    {
        "id": "word-break",
        "name": "word-break",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "word-break"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "word-break"
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
        "id": "writing-mode",
        "name": "writing-mode",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "writing-mode"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "writing-mode",
                    "writing"
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
        "id": "z-index",
        "name": "z-index",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "z-index"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "z-index",
                    "z"
                ]
            }
        ]
    },
    {
        "id": "zoom",
        "name": "zoom",
        "type": UtilityType.Native,
        "emit": {
            "type": "property",
            "property": "zoom"
        },
        "matchers": [
            {
                "type": "key",
                "keys": [
                    "zoom"
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
                    "font",
                    "f"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "font",
                    "f"
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
                    "text",
                    "t"
                ]
            },
            {
                "type": "value",
                "keys": [
                    "text",
                    "t"
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
