test('theme colors', () => {
    expect(new MasterCSS({
        variables: {
            primary: {
                '@light': '$(yellow-40)',
                '@dark': '$(yellow-50)'
            }
        }
    }).add('bg:primary').text)
        .toBe([
            '.light{--primary:255 195 0}',
            '.dark{--primary:239 175 0}',
            '.bg\\:primary{background-color:rgb(var(--primary))}',
        ].join(''))
})