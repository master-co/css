

export default {
    modeTrigger: 'class',
    modes: ['light', 'dark'],
    variables: [
        { namespace: 'font-size', key: 'sm', value: 16 },
        { namespace: 'font-size', key: 'md', value: 20 },
        { namespace: 'tracking', key: 'wide', value: .4 },
        { namespace: 'border', key: 'inputborder', value: '2|solid|color-black' },
        { namespace: 'shadow', key: 'x2', value: '0 25px 50px -12px rgb(0 0 0 / 25%)' },
        { namespace: 'inset', key: 'sm', value: 10 },
        { namespace: 'inset', key: 'md', value: 20 },
        { namespace: 'color', key: 'primary', value: '$(color-black)' },
        { namespace: 'color', key: 'primary-code', value: '$(color-black)' },
        { namespace: 'color', key: 'primary-stage-1', value: '$(color-white)' },
        { namespace: 'color', key: 'primary-alpha', value: '$(color-white)/.1' },
        { namespace: 'color', key: 'primary-rgb1', value: 'rgb(0, 0, 0)' },
        { namespace: 'color', key: 'primary-rgb2', value: 'oklch(0% 0 none)' },
        { namespace: 'color', key: 'primary-rgb3', value: 'rgb(0 0 0/.5)' },
        { namespace: 'color', key: 'primary-2', value: '$color-primary-rgb3/.7' },
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
        {
            name: 'btn',
            type: -4,
            layer: 'components',
            rules: [
                { selector: '&', declarations: { 'font-size': '0.875rem' } },
                { selector: '&', declarations: { height: '2.5rem' } },
                { selector: '&', declarations: { 'text-align': 'center' } },
                { selector: '&', declarations: { 'background-color': 'var(--color-primary)' } },
                { selector: '&', declarations: { color: '#fff' } },
                { selector: '&', declarations: { 'font-weight': '500' } }
            ]
        },
        { name: 'show', type: -4, declarations: { display: 'block' } },
        { name: 'hide-text', type: -4, declarations: { 'font-size': '0px' } },
        { name: 'zero', type: -4, declarations: { 'font-size': '0px', height: '0px' } }
    ],
    variants: [
        { name: 'custom', raw: ':custom', selector: '&div>:first+button' },
        { name: 'custom-1', raw: ':custom-1', selector: '&div' },
        { name: 'tablet', raw: '@tablet', atRules: ['@media (width>=768)'] },
        { name: 'laptop', raw: '@laptop', atRules: ['@media (width>=1024)'] },
        { name: 'desktop', raw: '@desktop', atRules: ['@media (width>=1280)'] },
        { name: 'custom-1', raw: '@custom-1', atRules: ['@media (width>=2500)'] },
        { name: 'watch', raw: '@watch', atRules: ['@media (width<=42mm) and (width>=38mm)'] },
        { name: 'device-watch', raw: '@device-watch', atRules: ['@media (width<=42mm) and (width>=38mm)'] }
    ],
    rootSize: 16,
} as any
