test('text-truncate', () => {
    expect(new MasterCSS().create('text-truncate:3')?.text).toBe('.text-truncate\\:3{overflow:hidden;display:-webkit-box;overflow-wrap:break-word;text-overflow:ellipsis;-webkit-box-orient:vertical;-webkit-line-clamp:3}')
    expect(new MasterCSS().create('lines:3')?.text).toBe('.lines\\:3{overflow:hidden;display:-webkit-box;overflow-wrap:break-word;text-overflow:ellipsis;-webkit-box-orient:vertical;-webkit-line-clamp:3}')
})
