export const MASTER_CSS_SHIKI_SCOPE_NAME = 'master-css.directive.injection'
export const MASTER_CSS_SHIKI_INJECT_TO = [
    'source.css',
    'source.css.scss',
    'source.css.less',
    'source.css.postcss'
] as const

export interface MasterCSSTextMateGrammar {
    name: string
    scopeName: string
    injectionSelector: string
    patterns: any[]
    repository: Record<string, any>
    [key: string]: any
}

export const MASTER_CSS_TEXTMATE_GRAMMAR: MasterCSSTextMateGrammar = {
    "name": "Master CSS Directive Injection",
    "scopeName": "master-css.directive.injection",
    "injectionSelector": "L:source.css -comment -string, L:source.css.scss -comment -string, L:source.css.less -comment -string, L:source.css.postcss -comment -string",
    "patterns": [
        {
            "include": "#master-directive"
        }
    ],
    "repository": {
        "comment": {
            "patterns": [
                {
                    "begin": "/\\*",
                    "end": "\\*/",
                    "name": "comment.block.css"
                }
            ]
        },
        "master-directive": {
            "patterns": [
                {
                    "begin": "(@)(source)\\b",
                    "beginCaptures": {
                        "1": {
                            "name": "punctuation.definition.keyword.master-css"
                        },
                        "2": {
                            "name": "keyword.control.at-rule.master-css"
                        }
                    },
                    "end": "(;)|$",
                    "endCaptures": {
                        "1": {
                            "name": "punctuation.section.master-css"
                        }
                    },
                    "patterns": [
                        {
                            "include": "#master-source-prelude"
                        }
                    ]
                },
                {
                    "begin": "(@)(reference|blocklist)\\b",
                    "beginCaptures": {
                        "1": {
                            "name": "punctuation.definition.keyword.master-css"
                        },
                        "2": {
                            "name": "keyword.control.at-rule.master-css"
                        }
                    },
                    "end": "(;)|$",
                    "endCaptures": {
                        "1": {
                            "name": "punctuation.section.master-css"
                        }
                    },
                    "patterns": [
                        {
                            "include": "#master-plain-string"
                        },
                        {
                            "match": "[;{}]",
                            "name": "punctuation.section.master-css"
                        }
                    ]
                },
                {
                    "begin": "(@)(preserve)\\b",
                    "beginCaptures": {
                        "1": {
                            "name": "punctuation.definition.keyword.master-css"
                        },
                        "2": {
                            "name": "keyword.control.at-rule.master-css"
                        }
                    },
                    "end": "(;)|$",
                    "endCaptures": {
                        "1": {
                            "name": "punctuation.section.master-css"
                        }
                    },
                    "patterns": [
                        {
                            "include": "#master-preserve-prelude"
                        }
                    ]
                },
                {
                    "begin": "(@)(theme)\\b",
                    "beginCaptures": {
                        "1": {
                            "name": "punctuation.definition.keyword.master-css"
                        },
                        "2": {
                            "name": "keyword.control.at-rule.master-css"
                        }
                    },
                    "end": "(;)|(?<=\\})|$",
                    "endCaptures": {
                        "1": {
                            "name": "punctuation.section.master-css"
                        }
                    },
                    "patterns": [
                        {
                            "include": "#master-block"
                        },
                        {
                            "include": "#master-theme-prelude"
                        }
                    ]
                },
                {
                    "begin": "(@)(master|settings|safelist|defaults|components|utilities|custom-variant|compose|variant|slot|dark|light)\\b",
                    "beginCaptures": {
                        "1": {
                            "name": "punctuation.definition.keyword.master-css"
                        },
                        "2": {
                            "name": "keyword.control.at-rule.master-css"
                        }
                    },
                    "end": "(;)|(?<=\\})|$",
                    "endCaptures": {
                        "1": {
                            "name": "punctuation.section.master-css"
                        }
                    },
                    "patterns": [
                        {
                            "include": "#master-block"
                        },
                        {
                            "include": "#master-prelude"
                        }
                    ]
                }
            ]
        },
        "master-prelude": {
            "patterns": [
                {
                    "include": "#master-string"
                },
                {
                    "include": "#master-query"
                },
                {
                    "include": "#master-selector"
                },
                {
                    "include": "#master-class-fragment"
                },
                {
                    "match": "[;{}]",
                    "name": "punctuation.section.master-css"
                }
            ]
        },
        "master-source-prelude": {
            "patterns": [
                {
                    "include": "#master-plain-string"
                },
                {
                    "match": "\\b(?:not|required)\\b(?!-)",
                    "name": "storage.modifier.master-css"
                },
                {
                    "match": "[;{}]",
                    "name": "punctuation.section.master-css"
                }
            ]
        },
        "master-theme-prelude": {
            "patterns": [
                {
                    "match": "\\b(?:inline|static)\\b(?!-)",
                    "name": "storage.modifier.master-css"
                },
                {
                    "match": "(?<![-_a-zA-Z0-9])[_a-zA-Z-][_a-zA-Z0-9-]*(?![-_a-zA-Z0-9])",
                    "name": "support.constant.property-value.master-css"
                },
                {
                    "match": "[;{}]",
                    "name": "punctuation.section.master-css"
                }
            ]
        },
        "master-preserve-prelude": {
            "patterns": [
                {
                    "match": "\\bnative\\b",
                    "name": "support.constant.property-value.master-css"
                },
                {
                    "match": "[;{}]",
                    "name": "punctuation.section.master-css"
                }
            ]
        },
        "master-managed-pattern": {
            "patterns": [
                {
                    "begin": "\\b([_a-zA-Z-][_a-zA-Z0-9-]*)(:)(<)",
                    "beginCaptures": {
                        "1": {
                            "name": "support.type.property-name.master-css"
                        },
                        "2": {
                            "name": "keyword.operator.master-css"
                        },
                        "3": {
                            "name": "punctuation.definition.generic.begin.master-css"
                        }
                    },
                    "end": "(>)",
                    "endCaptures": {
                        "1": {
                            "name": "punctuation.definition.generic.end.master-css"
                        }
                    },
                    "patterns": [
                        {
                            "match": "[~|=*]",
                            "name": "keyword.operator.master-css"
                        },
                        {
                            "match": "[_a-zA-Z-][_a-zA-Z0-9-]*",
                            "name": "variable.parameter.master-css"
                        }
                    ]
                },
                {
                    "begin": "\\b([_a-zA-Z-][_a-zA-Z0-9-]*)(<)",
                    "beginCaptures": {
                        "1": {
                            "name": "entity.other.attribute-name.class.master-css"
                        },
                        "2": {
                            "name": "punctuation.definition.generic.begin.master-css"
                        }
                    },
                    "end": "(>)",
                    "endCaptures": {
                        "1": {
                            "name": "punctuation.definition.generic.end.master-css"
                        }
                    },
                    "patterns": [
                        {
                            "match": "\\|",
                            "name": "keyword.operator.master-css"
                        },
                        {
                            "match": "[_a-zA-Z-][_a-zA-Z0-9-]*",
                            "name": "support.constant.property-value.master-css"
                        }
                    ]
                }
            ]
        },
        "master-managed-entry-selector": {
            "patterns": [
                {
                    "match": "(?<![:@._a-zA-Z0-9-])([_a-zA-Z-][_a-zA-Z0-9-]*)(?=:{1,2}[_a-zA-Z-][_a-zA-Z0-9-]*\\s*\\{)",
                    "name": "entity.other.attribute-name.class.master-css"
                },
                {
                    "match": "(:{1,2})([_a-zA-Z-][_a-zA-Z0-9-]*)(?=\\s*\\{)",
                    "captures": {
                        "1": {
                            "name": "punctuation.definition.entity.master-css"
                        },
                        "2": {
                            "name": "entity.other.attribute-name.pseudo-class.master-css"
                        }
                    }
                }
            ]
        },
        "master-block": {
            "patterns": [
                {
                    "begin": "\\{",
                    "beginCaptures": {
                        "0": {
                            "name": "punctuation.section.master-css"
                        }
                    },
                    "end": "\\}",
                    "endCaptures": {
                        "0": {
                            "name": "punctuation.section.master-css"
                        }
                    },
                    "patterns": [
                        {
                            "include": "#comment"
                        },
                        {
                            "include": "#master-string"
                        },
                        {
                            "include": "#master-directive"
                        },
                        {
                            "include": "#master-managed-pattern"
                        },
                        {
                            "include": "#master-managed-entry-selector"
                        },
                        {
                            "include": "#master-query"
                        },
                        {
                            "include": "#master-selector"
                        },
                        {
                            "include": "#master-value"
                        },
                        {
                            "include": "#master-block"
                        }
                    ]
                }
            ]
        },
        "master-class-fragment": {
            "patterns": [
                {
                    "match": "(?<![:@._a-zA-Z0-9-])([_a-zA-Z-][_a-zA-Z0-9-]*)(?=:{1,2}[_a-zA-Z-][_a-zA-Z0-9-]*\\s*\\{)",
                    "name": "entity.other.attribute-name.class.master-css"
                },
                {
                    "match": "(?<=:)(?![_a-zA-Z-][_a-zA-Z0-9-]*\\s*\\{)([_a-zA-Z-][_a-zA-Z0-9-]*)(?=[:@!_\\s;'\")]|$)",
                    "name": "support.constant.property-value.master-css"
                },
                {
                    "match": "(?<=:)([_a-zA-Z-][_a-zA-Z0-9-]*)(?=@|\\s|[;'\"])",
                    "name": "entity.other.attribute-name.pseudo-class.master-css"
                },
                {
                    "match": "(?<![:@._a-zA-Z0-9-])([_a-zA-Z-][_a-zA-Z0-9-]*)(:)(?![_a-zA-Z-][_a-zA-Z0-9-]*\\s*\\{)",
                    "captures": {
                        "1": {
                            "name": "support.type.property-name.master-css"
                        },
                        "2": {
                            "name": "keyword.operator.master-css"
                        }
                    }
                },
                {
                    "match": "(:{1,2})([_a-zA-Z-][_a-zA-Z0-9-]*)",
                    "captures": {
                        "1": {
                            "name": "punctuation.definition.entity.master-css"
                        },
                        "2": {
                            "name": "entity.other.attribute-name.pseudo-class.master-css"
                        }
                    }
                },
                {
                    "match": "(@[_a-zA-Z-][_a-zA-Z0-9-]*)",
                    "name": "keyword.control.at-rule.master-css.query"
                },
                {
                    "match": "(?<![:@._a-zA-Z0-9-])[_a-zA-Z-][_a-zA-Z0-9-]*(?!\\s*:)",
                    "name": "entity.other.attribute-name.class.master-css"
                }
            ]
        },
        "master-selector": {
            "patterns": [
                {
                    "match": "(&|[>+~(),\\[\\]])",
                    "name": "keyword.operator.selector.master-css"
                },
                {
                    "match": "(?<![.#:_a-zA-Z0-9-])([a-zA-Z][_a-zA-Z0-9-]*)(?=\\s*(?:[,)>+~{]|$))",
                    "name": "entity.name.tag.master-css"
                },
                {
                    "match": "(\\.)([_a-zA-Z-][_a-zA-Z0-9-]*)",
                    "captures": {
                        "1": {
                            "name": "punctuation.definition.entity.master-css"
                        },
                        "2": {
                            "name": "entity.other.attribute-name.class.master-css"
                        }
                    }
                },
                {
                    "match": "(#)([_a-zA-Z-][_a-zA-Z0-9-]*)",
                    "captures": {
                        "1": {
                            "name": "punctuation.definition.entity.master-css"
                        },
                        "2": {
                            "name": "variable.other.master-css"
                        }
                    }
                }
            ]
        },
        "master-query": {
            "patterns": [
                {
                    "match": "(@)([a-zA-Z])?(>=|<=|>|<|=)([_a-zA-Z-][_a-zA-Z0-9-]*)",
                    "captures": {
                        "1": {
                            "name": "punctuation.definition.keyword.master-css"
                        },
                        "2": {
                            "name": "keyword.control.at-rule.master-css.query"
                        },
                        "3": {
                            "name": "keyword.operator.master-css.query"
                        },
                        "4": {
                            "name": "support.constant.property-value.master-css.query"
                        }
                    }
                },
                {
                    "match": "(@)(media|container|supports|layer|starting-style|[_a-zA-Z-][_a-zA-Z0-9-]*)\\b",
                    "captures": {
                        "1": {
                            "name": "punctuation.definition.keyword.master-css"
                        },
                        "2": {
                            "name": "keyword.control.at-rule.master-css.query"
                        }
                    }
                },
                {
                    "match": "\\b([a-zA-Z])?(>=|<=|>|<|=)([_a-zA-Z-][_a-zA-Z0-9-]*)",
                    "captures": {
                        "1": {
                            "name": "keyword.control.at-rule.master-css.query"
                        },
                        "2": {
                            "name": "keyword.operator.master-css.query"
                        },
                        "3": {
                            "name": "support.constant.property-value.master-css.query"
                        }
                    }
                },
                {
                    "match": "(>=|<=|>|<|=)",
                    "name": "keyword.operator.master-css.query"
                }
            ]
        },
        "master-plain-string": {
            "patterns": [
                {
                    "begin": "\"",
                    "beginCaptures": {
                        "0": {
                            "name": "punctuation.definition.string.begin.master-css"
                        }
                    },
                    "end": "\"",
                    "endCaptures": {
                        "0": {
                            "name": "punctuation.definition.string.end.master-css"
                        }
                    },
                    "name": "string.quoted.double.master-css",
                    "patterns": [
                        {
                            "match": "\\\\.",
                            "name": "constant.character.escape.master-css"
                        }
                    ]
                },
                {
                    "begin": "'",
                    "beginCaptures": {
                        "0": {
                            "name": "punctuation.definition.string.begin.master-css"
                        }
                    },
                    "end": "'",
                    "endCaptures": {
                        "0": {
                            "name": "punctuation.definition.string.end.master-css"
                        }
                    },
                    "name": "string.quoted.single.master-css",
                    "patterns": [
                        {
                            "match": "\\\\.",
                            "name": "constant.character.escape.master-css"
                        }
                    ]
                }
            ]
        },
        "master-string": {
            "patterns": [
                {
                    "begin": "\"",
                    "beginCaptures": {
                        "0": {
                            "name": "punctuation.definition.string.begin.master-css"
                        }
                    },
                    "end": "\"",
                    "endCaptures": {
                        "0": {
                            "name": "punctuation.definition.string.end.master-css"
                        }
                    },
                    "name": "string.quoted.double.master-css",
                    "patterns": [
                        {
                            "match": "\\\\.",
                            "name": "constant.character.escape.master-css"
                        },
                        {
                            "include": "#master-class-fragment"
                        }
                    ]
                },
                {
                    "begin": "'",
                    "beginCaptures": {
                        "0": {
                            "name": "punctuation.definition.string.begin.master-css"
                        }
                    },
                    "end": "'",
                    "endCaptures": {
                        "0": {
                            "name": "punctuation.definition.string.end.master-css"
                        }
                    },
                    "name": "string.quoted.single.master-css",
                    "patterns": [
                        {
                            "match": "\\\\.",
                            "name": "constant.character.escape.master-css"
                        },
                        {
                            "include": "#master-class-fragment"
                        }
                    ]
                }
            ]
        },
        "master-value": {
            "patterns": [
                {
                    "match": "--value(?=\\()",
                    "name": "support.function.misc.master-css"
                },
                {
                    "match": "\\$[_a-zA-Z-][_a-zA-Z0-9-]*",
                    "name": "variable.other.master-css"
                },
                {
                    "match": "--[_a-zA-Z-][_a-zA-Z0-9-]*",
                    "name": "variable.css.custom-property.master-css"
                }
            ]
        }
    }
}

export function createMasterCSSShikiLanguageRegistration(): MasterCSSTextMateGrammar & { injectTo: string[] } {
    return {
        ...MASTER_CSS_TEXTMATE_GRAMMAR,
        injectTo: [...MASTER_CSS_SHIKI_INJECT_TO]
    }
}

export const masterCSSShikiLanguage = createMasterCSSShikiLanguageRegistration()
