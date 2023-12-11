test('functions', () => {
    expect(new MasterCSS().create('blur(32)')?.text).toBe('.blur\\(32\\){filter:blur(2rem)}')
    expect(new MasterCSS().create('filter:invert(1)')?.text).toBe('.filter\\:invert\\(1\\){filter:invert(1)}')

    expect(new MasterCSS().create('scale(.2)')?.text).toBe('.scale\\(\\.2\\){transform:scale(.2)}')
    expect(new MasterCSS().create('translateX(40)')?.text).toBe('.translateX\\(40\\){transform:translateX(2.5rem)}')

    expect(new MasterCSS().create('width:max(0,16)')?.text).toBe('.width\\:max\\(0\\,16\\){width:max(0rem,1rem)}')
    expect(new MasterCSS().create('box-shadow:0|2|3|rgba(0,0,0,.1)')?.text).toBe('.box-shadow\\:0\\|2\\|3\\|rgba\\(0\\,0\\,0\\,\\.1\\){box-shadow:0rem 0.125rem 0.1875rem rgba(0,0,0,.1)}')

    expect(new MasterCSS().create('grid-template-cols:repeat(2,auto|.6|calc(3-max(2,1)))')?.text).toBe('.grid-template-cols\\:repeat\\(2\\,auto\\|\\.6\\|calc\\(3-max\\(2\\,1\\)\\)\\){grid-template-columns:repeat(2,auto .6 calc(0.1875rem - max(2, 1) / 16 * 1rem))}')

    expect(new MasterCSS().create('$primary:red')?.text).toBe('.\\$primary\\:red{--primary:rgb(209 26 30)}')
    expect(new MasterCSS().create('$primary:red-80')?.text).toBe('.\\$primary\\:red-80{--primary:rgb(253 207 207)}')
    expect(new MasterCSS().create('$primary:red/.5')?.text).toBe('.\\$primary\\:red\\/\\.5{--primary:rgb(209 26 30/.5)}')
    expect(new MasterCSS().create('$primary:red-80/.5')?.text).toBe('.\\$primary\\:red-80\\/\\.5{--primary:rgb(253 207 207/.5)}')
})

test('checks gradient-related functions with color variables', () => {
    expect(new MasterCSS().create('bg:linear-gradient(0deg,gray-14|0%,gray-16|100%)')?.text).toContain('background-image:linear-gradient(0deg,rgb(39 38 40) 0%,rgb(41 40 42) 100%)')
})