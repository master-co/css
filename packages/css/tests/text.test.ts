test('text', () => {
    expect(new MasterCSS().create('text:20')?.text).toContain('font-size:1.25rem;line-height:calc(1.25rem + 0.875em)')
    expect(new MasterCSS().create('text:50%')?.text).toContain('font-size:50%;line-height:calc(50% + 0.875em)')

    expect(new MasterCSS().create('text:#fff')?.text).toContain('-webkit-text-fill-color:#fff')
    expect(new MasterCSS().create('text:current')?.text).toContain('-webkit-text-fill-color:currentColor')
    expect(new MasterCSS().create('text:transparent')?.text).toContain('-webkit-text-fill-color:transparent')
    expect(new MasterCSS().create('text-fill:current')?.text).toContain('-webkit-text-fill-color:currentColor')
    expect(new MasterCSS().create('text-fill:transparent')?.text).toContain('-webkit-text-fill-color:transparent')

    expect(new MasterCSS().create('text-stroke:#fff')?.text).toContain('-webkit-text-stroke-color:#fff')
    expect(new MasterCSS().create('text-stroke:current')?.text).toContain('-webkit-text-stroke-color:currentColor')
    expect(new MasterCSS().create('text-stroke:transparent')?.text).toContain('-webkit-text-stroke-color:transparent')
})
