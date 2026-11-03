export const mcssLanguage = {

    'Mgroup': {
        pattern: /{[^\s]+(?=\})/,
        greedy: true,
        inside:
        {
            'Mbracket': {
                pattern: /[\{\}]/,
                greedy: true,
            },
            'Mkey': {
                pattern: /[^\s;:]+(?=:)/,
                greedy: true
            },
            'Mroot':
            {
                pattern: /:?[^\s:]+(;|$)/,
                greedy: true,
                inside: {
                    'Mbracket': {
                        pattern: /[\(\)\{\}\[\]]/,
                        greedy: true,
                    },
                    'Mcombinator': {
                        pattern: /[\+\>\~]/,
                        greedy: true,
                    },
                    'Mcomma': {
                        pattern: /,/,
                        greedy: true,
                    },
                    'Msemicolon': {
                        pattern: /;/,
                        greedy: true,
                    },
                    'Mcolon': {
                        pattern: /:/,
                        greedy: true,
                    },
                    'Mspace': {
                        pattern: /[_|]/,
                        greedy: true,
                    },

                    'Mimportant': {
                        pattern: /!/,
                        greedy: true,
                    },
                    'Moperator': {
                        pattern: /\//,
                        greedy: true,
                    },
                    'Mvalue': {
                        pattern: /[^\s:;@>\[\]]+/,
                        greedy: true,
                        inside:
                        {
                            'Mcombinator': {
                                pattern: /[\+\>\~]/,
                                greedy: true,
                            },
                            'Mcomma': {
                                pattern: /,/,
                                greedy: true,
                            },
                            'Mspace': {
                                pattern: /[_|]/,
                                greedy: true,
                            },
                            'Mimportant': {
                                pattern: /!/,
                                greedy: true,
                            },
                            'Moperator': {
                                pattern: /\//,
                                greedy: true,
                            },
                            'Mnumber_unit':
                            {
                                pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?(?:(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|Q|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|fr)(?=\b|$))?/,
                                greedy: true,
                                inside:
                                {
                                    'Mnumber': {
                                        pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?/,
                                        greedy: true
                                    },
                                    'Munit': {
                                        pattern: /(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|Q|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|fr)/,
                                        greedy: true
                                    },
                                }
                            },
                        }
                    },
                }
            }
        }
    },
    'Mbracket': {
        pattern: /[\{\}]/,
        greedy: true,
    },
    'Mkey': {
        pattern: /(?:[^\s;:\"'*]+)(?=:(?!\b(?:\:|out\-of\-range|first\-of\-type|last\-of\-type|only\-of\-type|first\-selector\-button|scrollbar\-track\-piece|search\-cancel\-button|search\-results\-button|any\-link|focus\-visible|focus\-within|read\-only|read\-write|placeholder\-showen|in\-range|first\-letter|first\-child|last\-child|only\-child|first\-letter|first\-line|scrollbar\-button|scrollbar\-thumb|scrollbar\-track|scrollbar\-corner|link|visited|target|scope|hover|active|focus|autofill|enabled|disabled|default|checked|indeterminate|valid|invalid|required|optional|root|empty|defined|fullscreen|odd|even|first|last|after|before|backdrop|cue|maker|placeholder|selection|scrollbar|resizer|nth\-last\-of\-type|nth\-last\-child|nth\-of\-type|nth\-child|host\-context|lang|host|is|not|nth|where|part|slotted)\b))/,
        greedy: true
    },
    'Mmedia': {
        pattern: /@(?:[^\s;\"`'|]+)(?=$|\s)/,
        greedy: true,
        inside: {
            'Mroot':
            {
                pattern: /(\[\(\{\[])[^\s\(\)\{\}\[\]]+/,
                greedy: true,
                inside: {
                    'Mbracket': {
                        pattern: /[\(\)\{\}\[\]]/,
                        greedy: true,
                    },
                    'Mkey': {
                        pattern: /[^\s;:]+(?=:)/,
                        greedy: true
                    },
                    'Mvalue': {
                        pattern: /[^\s]+/,
                        greedy: true,
                        inside: {
                            'Mnumber_unit':
                            {
                                pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?(?:(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|Q|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|fr)(?=\b|$))?/,
                                greedy: true,
                                inside:
                                {
                                    'Mnumber': {
                                        pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?/,
                                        greedy: true
                                    },
                                    'Munit': {
                                        pattern: /(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|Q|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|fr)/,
                                        greedy: true
                                    },
                                }
                            },
                        }
                    }
                }
            }
        }
    },

    'Mroot': {
        pattern: /[^\s*]+/,
        greedy: true,
        inside: {
            'Mpunctuationkey': {
                pattern: /^(@|~)/,
                greedy: true
            },
            'Mselector3': {
                pattern: /(\[)[^/s]*(\])/,
                greedy: true,
                alias: 'Mselector',
                inside: {
                    'Mbracket': {
                        pattern: /[\(\)\{\}\[\]]/,
                        greedy: true,
                    },
                }
            },
            'Mselector': {
                pattern: /(::|:|\.|\[)(?:out\-of\-range|first\-of\-type|last\-of\-type|only\-of\-type|first\-selector\-button|scrollbar\-track\-piece|search\-cancel\-button|search\-results\-button|any\-link|focus\-visible|focus\-within|read\-only|read\-write|placeholder\-showen|in\-range|first\-letter|first\-child|last\-child|only\-child|first\-letter|first\-line|scrollbar\-button|scrollbar\-thumb|scrollbar\-track|scrollbar\-corner|link|visited|target|scope|hover|active|focus|autofill|enabled|disabled|default|checked|indeterminate|valid|invalid|required|optional|root|empty|defined|fullscreen|odd|even|first|last|after|before|backdrop|cue|maker|placeholder|selection|scrollbar|resizer|nth\-last\-of\-type|nth\-last\-child|nth\-of\-type|nth\-child|host\-context|lang|host|is|not|nth|where|part|slotted)\b/,
                greedy: true,
                inside: {
                    'Mbracket': {
                        pattern: /[\(\)\{\}\[\]]/,
                        greedy: true,
                    },
                    'Mcomma': {
                        pattern: /,/,
                        greedy: true,
                    },
                    'Mcolon': {
                        pattern: /::|:/,
                        greedy: true,
                    },
                },
            },
            'Mselector2': {
                pattern: /([\+\>\~\_])li\b/,
                greedy: true,
                alias: 'Mselector',
                inside: {
                    'Mcombinator': {
                        pattern: /[\+\>\~]/,
                        greedy: true,
                    },
                    'Mspace': {
                        pattern: /[_|]/,
                        greedy: true,
                    },
                },
            },
            'Mbracket': {
                pattern: /[\(\)\{\}\[\]]/,
                greedy: true,
            },
            'Mcombinator': {
                pattern: /[\+\>\~]/,
                greedy: true,
            },
            'Mcomma': {
                pattern: /,/,
                greedy: true,
            },
            'Msemicolon': {
                pattern: /;/,
                greedy: true,
            },
            'Mcolon': {
                pattern: /::|:/,
                greedy: true,
            },
            'Mspace': {
                pattern: /[_|]/,
                greedy: true,
            },

            'Mimportant': {
                pattern: /!/,
                greedy: true,
            },
            'Moperator': {
                pattern: /\//,
                greedy: true,
            },
            'Mvalue': {
                pattern: /[^\s:@>\[\]]+/,
                greedy: true,
                inside:
                {
                    'Mselector2': {
                        pattern: /([\+\>\~\_])li\b/,
                        greedy: true,
                        alias: 'Mselector',
                        inside: {
                            'Mcombinator': {
                                pattern: /[\+\>\~]/,
                                greedy: true,
                            },
                            'Mspace': {
                                pattern: /[_|]/,
                                greedy: true,
                            },
                        },
                    },
                    'Mbracket': {
                        pattern: /[\(\)\{\}\[\]]/,
                        greedy: true,
                    },
                    'Mcombinator': {
                        pattern: /[\+\>\~]/,
                        greedy: true,
                    },
                    'Mcomma': {
                        pattern: /,/,
                        greedy: true,
                    },
                    'Msemicolon': {
                        pattern: /;/,
                        greedy: true,
                    },
                    'Mcolon': {
                        pattern: /::|:/,
                        greedy: true,
                    },
                    'Mspace': {
                        pattern: /[_|]/,
                        greedy: true,
                    },

                    'Mimportant': {
                        pattern: /!/,
                        greedy: true,
                    },
                    'Moperator': {
                        pattern: /\//,
                        greedy: true,
                    },
                    'Mselector':
                    {
                        pattern: /\.[a-z]+/,
                        greedy: true
                    },
                    'Mnumber_unit':
                    {
                        pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?(?:(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|Q|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|fr)(?=\b|$))?/,
                        greedy: true,
                        inside:
                        {
                            'Mnumber': {
                                pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?/,
                                greedy: true
                            },
                            'Munit': {
                                pattern: /(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|Q|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|fr)/,
                                greedy: true
                            },
                        }
                    },

                }
            },
            'Mmedia': {
                pattern: /@[^\s;\"`']+/,
                greedy: true,
                inside: {
                    'Mbracket': {
                        pattern: /[\(\)\{\}\[\]]/,
                        greedy: true,
                    },
                    'Mroot':
                    {
                        pattern: /(\[\(\{\[])[^\s\(\)\{\}\[\]]+/,
                        greedy: true,
                        inside: {
                            'Mbracket': {
                                pattern: /[\(\)\{\}\[\]]/,
                                greedy: true,
                            },
                            'Mmedia_key': {
                                pattern: /[^\s;:]+(?=:)/,
                                greedy: true,
                            },
                            'Mmedia_value': {
                                pattern: /[^\s]+/,
                                greedy: true,
                                inside: {
                                    'Mnumber_unit':
                                    {
                                        pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?(?:(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|Q|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|fr)(?=\b|$))?/,
                                        greedy: true,
                                        inside:
                                        {
                                            'Mnumber': {
                                                pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?/,
                                                greedy: true
                                            },
                                            'Munit': {
                                                pattern: /(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|Q|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|fr)/,
                                                greedy: true
                                            },
                                        }
                                    },
                                }
                            }
                        }
                    }
                }
            },

        }
    }
}



