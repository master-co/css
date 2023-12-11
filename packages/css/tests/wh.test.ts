test('wh', () => {
    expect(new MasterCSS().create('16x10')?.text).toBe('.\\31 6x10{width:1rem;height:0.625rem}')
    expect(new MasterCSS().create('16xcalc(min(30,50)-25)')?.text).toBe('.\\31 6xcalc\\(min\\(30\\,50\\)-25\\){width:1rem;height:calc(min(30, 50) / 16 * 1rem - 1.5625rem)}')
    expect(new MasterCSS().create('min(10,calc(25-10))x10')?.text).toBe('.min\\(10\\,calc\\(25-10\\)\\)x10{width:min(0.625rem,calc(1.5625rem - 0.625rem));height:0.625rem}')
    expect(new MasterCSS().create('min(10,calc(25-10))xcalc(min(30,50)-25)')?.text).toBe('.min\\(10\\,calc\\(25-10\\)\\)xcalc\\(min\\(30\\,50\\)-25\\){width:min(0.625rem,calc(1.5625rem - 0.625rem));height:calc(min(30, 50) / 16 * 1rem - 1.5625rem)}')
})
