

export default {
    components: {
        btn: [
            { selector: '&', declarations: { 'font-size': '0.875rem' } },
            { selector: '&', declarations: { height: '2.5rem' } },
            { selector: '&', declarations: { 'text-align': 'center' } },
            { selector: '&', declarations: { 'background-color': 'var(--color-primary)' } },
            { selector: '&', declarations: { color: '#fff' } },
            { selector: '&', declarations: { 'font-weight': '500' } }
        ]
    },
    modeTrigger: 'class',
    modes: ['light', 'dark'],
    variables: [
        { namespace: 'font-size', key: 'sm', value: 16 },
        { namespace: 'font-size', key: 'md', value: 20 },
        { namespace: 'letter-spacing', key: 'wide', value: .4 },
        { namespace: 'border', key: 'inputborder', value: '2|solid|color-black' },
        { namespace: 'box-shadow', key: 'x2', value: '0 25px 50px -12px rgb(0 0 0 / 25%)' },
        { namespace: 'inset', key: 'sm', value: 10 },
        { namespace: 'inset', key: 'md', value: 20 },
        { namespace: 'color', key: 'primary', value: '$(color-black)' },
        { namespace: 'color.primary', key: 'code', value: '$(color-black)' },
        { namespace: 'color.primary.stage', key: '1', value: '$(color-white)' },
        { namespace: 'color.primary', key: 'alpha', value: '$(color-white)/.1' },
        { namespace: 'color.primary', key: 'rgb1', value: 'rgb(0, 0, 0)' },
        { namespace: 'color.primary', key: 'rgb2', value: 'oklch(0% 0 none)' },
        { namespace: 'color.primary', key: 'rgb3', value: 'rgb(0 0 0/.5)' },
        { namespace: 'color.primary', key: '2', value: '$color-primary-rgb3/.7' },
        { namespace: 'color', key: 'input', value: '#123456' },
        { namespace: 'color', key: 'code', value: '$(color-accent)' },
        { namespace: 'color', key: 'primary', value: '$(color-black)', mode: 'light' },
        { namespace: 'color', key: 'primary-text', value: '$(color-white)', mode: 'light' },
        { namespace: 'color', key: 'primary-active', value: '$(color-gray)', mode: 'light' },
        { namespace: 'color', key: 'primary-stage-1', value: '$(color-black)', mode: 'light' },
        { namespace: 'color', key: 'accent', value: '$(color-black)', mode: 'light' },
        { namespace: 'color', key: 'major', value: '$(color-black)', mode: 'light' },
        { namespace: 'color', key: 'content', value: '$(color-black)', mode: 'light' },
        { namespace: 'color', key: 'fade', value: '$(color-black)', mode: 'light' },
        { namespace: 'color', key: 'fade-light', value: '$color-fade', mode: 'light' },
        { namespace: 'color', key: 'primary', value: '$(color-white)', mode: 'dark' },
        { namespace: 'color', key: 'primary-text', value: '$(color-black)', mode: 'dark' },
        { namespace: 'color', key: 'primary-active', value: '$(color-white)', mode: 'dark' },
        { namespace: 'color', key: 'primary-code', value: '$(color-white)', mode: 'dark' },
        { namespace: 'color', key: 'primary-stage-1', value: '$(color-white)', mode: 'dark' },
        { namespace: 'color', key: 'accent', value: '$(color-white)', mode: 'dark' },
        { namespace: 'color', key: 'major', value: '$(color-white)', mode: 'dark' },
        { namespace: 'color', key: 'content', value: '$(color-white)', mode: 'dark' },
        { namespace: 'color', key: 'fade', value: '$(color-white)', mode: 'dark' }
    ],
    utilities: [
        { name: 'show', type: -4, declarations: { display: 'block' } },
        { name: 'hide-text', type: -4, declarations: { 'font-size': '0px' } },
        { name: 'zero', type: -4, declarations: { 'font-size': '0px', height: '0px' } }
    ],
    selectorTokens: {
        custom: 'div>:first+button',
        'custom-1': 'div'
    },
    atTokens: {
        tablet: 768,
        laptop: 1024,
        desktop: 1280,
        'custom-1': 2500,
        watch: 'media(width<=42mm)and(width>=38mm)',
        'device-watch': 'media(width<=42mm)and(width>=38mm)',
    },
    rootSize: 16,
} as any
