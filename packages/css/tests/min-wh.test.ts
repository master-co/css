test('min-wh', () => {
    expect(new MasterCSS().create('min:16x10')?.text).toBe('.min\\:16x10{min-width:1rem;min-height:0.625rem}')
    // expect(new MasterCSS().create('min:16xcalc(min(30,50)-25)', '.min\\:16xcalc\\(min\\(30\\,50\\)-25\\){min-width:1rem;min-height:calc(min(1.875rem)?.text).toBe(3.125rem) - 1.5625rem)}')
    // expect(new MasterCSS().create('min:min(10,calc(25-10))x10')?.text).toBe('.min\\:min\\(10\\,calc\\(25-10\\)\\)x10{min-width:min(0.625rem,calc(1.5625rem - 0.625rem));min-height:0.625rem}')
    // expect(new MasterCSS().create('min:min(10,calc(25-10))xcalc(min(30,50)-25)', '.min\\:min\\(10\\,calc\\(25-10\\)\\)xcalc\\(min\\(30\\,50\\)-25\\){min-width:min(0.625rem,calc(1.5625rem - 0.625rem));min-height:calc(min(1.875rem)?.text).toBe(3.125rem) - 1.5625rem)}')
})
