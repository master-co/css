test('size', () => {
    expect(new MasterCSS().create('size:4x')?.declarations).toStrictEqual({ width: '1rem', height: '1rem' })
    expect(new MasterCSS().create('size:16|32')?.declarations).toStrictEqual({ width: '1rem', height: '2rem' })
    expect(new MasterCSS().create('size:$(w)|$(h)')?.declarations).toStrictEqual({ width: 'var(--w)', height: 'var(--h)' })
    expect(new MasterCSS({ variables: { w: 16, h: 16 } }).create('size:$(w)|$(h)')?.declarations).toStrictEqual({ width: '1rem', height: '1rem' })
})

test('max size', () => {
    expect(new MasterCSS().create('max:4x')?.declarations).toStrictEqual({ 'max-width': '1rem', 'max-height': '1rem' })
    expect(new MasterCSS().create('max:16|32')?.declarations).toStrictEqual({ 'max-width': '1rem', 'max-height': '2rem' })
    expect(new MasterCSS().create('max:$(w)|$(h)')?.declarations).toStrictEqual({ 'max-width': 'var(--w)', 'max-height': 'var(--h)' })
    expect(new MasterCSS({ variables: { w: 16, h: 16 } }).create('max:$(w)|$(h)')?.declarations).toStrictEqual({ 'max-width': '1rem', 'max-height': '1rem' })
})

test('min size', () => {
    expect(new MasterCSS().create('min:4x')?.declarations).toStrictEqual({ 'min-width': '1rem', 'min-height': '1rem' })
    expect(new MasterCSS().create('min:16|32')?.declarations).toStrictEqual({ 'min-width': '1rem', 'min-height': '2rem' })
    expect(new MasterCSS().create('min:$(w)|$(h)')?.declarations).toStrictEqual({ 'min-width': 'var(--w)', 'min-height': 'var(--h)' })
    expect(new MasterCSS({ variables: { w: 16, h: 16 } }).create('min:$(w)|$(h)')?.declarations).toStrictEqual({ 'min-width': '1rem', 'min-height': '1rem' })
})

