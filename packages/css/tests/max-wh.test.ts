test('max-wh', () => {
    expect(new MasterCSS().create('max:16x10')?.text).toBe('.max\\:16x10{max-width:1rem;max-height:0.625rem}')
    expect(new MasterCSS().create('max:16xcalc(min(30,50)-25)')?.text).toBe('.max\\:16xcalc\\(min\\(30\\,50\\)-25\\){max-width:1rem;max-height:calc(min(30, 50) / 16 * 1rem - 1.5625rem)}')
    expect(new MasterCSS().create('max:min(10,calc(25-10))x10')?.text).toBe('.max\\:min\\(10\\,calc\\(25-10\\)\\)x10{max-width:min(0.625rem,calc(1.5625rem - 0.625rem));max-height:0.625rem}')
    expect(new MasterCSS().create('max:min(10,calc(25-10))xcalc(min(30,50)-25)')?.text).toBe('.max\\:min\\(10\\,calc\\(25-10\\)\\)xcalc\\(min\\(30\\,50\\)-25\\){max-width:min(0.625rem,calc(1.5625rem - 0.625rem));max-height:calc(min(30, 50) / 16 * 1rem - 1.5625rem)}')
})
