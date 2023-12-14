import { render } from '../src'

it('should not encode entities', () => {
    expect(render(
        '<span class="token punctuation">&lt;</span>div<span class="token punctuation">&gt;</span>').html
    ).toContain(
        '<span class="token punctuation">&lt;</span>div<span class="token punctuation">&gt;</span>'
    )
})

it('should not decode entities', () => {
    expect(render(
        `<div class="{content:'\`';fg:fade}_code:before"></div>`
    ).html).toEqual([
        '<style id="master">.\\{content\\:\\\'\\`\\\'\\;fg\\:fade\\}_code\\:before code:before{content:\'`\';color:fade}</style>',
        `<div class="{content:'\`';fg:fade}_code:before"></div>`
    ].join(''))
})