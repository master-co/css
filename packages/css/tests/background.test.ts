test('background', () => {
    expect(new MasterCSS().create('bg:red')?.text).toContain('background-color:rgb(209 26 30)')
    expect(new MasterCSS().create('bg:#fff')?.text).toContain('background-color:#fff')
    expect(new MasterCSS().create('bg:gray-90:hover@md@landscape')?.text).toBe('@media (min-width:1024px) and (orientation:landscape){.bg\\:gray-90\\:hover\\@md\\@landscape:hover{background-color:rgb(236 235 238)}}')
    expect(new MasterCSS().create('bg:transparent')?.text).toContain('background-color:transparent')
    expect(new MasterCSS().create('bg:current')?.text).toContain('background-color:currentColor')
    expect(new MasterCSS().create('background-clip:border')?.text).toContain('-webkit-background-clip:border-box;background-clip:border-box')
    expect(new MasterCSS().create('bg:url(\'#test\')')?.text).toContain('background-image:url(\'#test\')')
    expect(new MasterCSS().create('bg:gray-50|url(\'/images/wallpaper.jpg\')|no-repeat|top|left/cover')?.text).toContain('background:rgb(107 106 109) url(\'/images/wallpaper.jpg\') no-repeat top left/cover')
    expect(new MasterCSS().create('gradient(45deg,#f3ec78,#af4261)')?.text).toContain('background-image:linear-gradient(45deg,#f3ec78,#af4261)')
})

it('gradient-related functions should transform "current" to "currentColor"', () => {
    expect(new MasterCSS().create('bg:conic-gradient(current,black)')?.text).toContain('background-image:conic-gradient(currentColor,rgb(0 0 0))')
    expect(new MasterCSS().create('bg:linear-gradient(current,black)')?.text).toContain('background-image:linear-gradient(currentColor,rgb(0 0 0))')
    expect(new MasterCSS().create('bg:radial-gradient(current,black)')?.text).toContain('background-image:radial-gradient(currentColor,rgb(0 0 0))')
    expect(new MasterCSS().create('bg:repeating-linear-gradient(current,black)')?.text).toContain('background-image:repeating-linear-gradient(currentColor,rgb(0 0 0))')
    expect(new MasterCSS().create('bg:repeating-radial-gradient(current,black)')?.text).toContain('background-image:repeating-radial-gradient(currentColor,rgb(0 0 0))')
})