import config from './config'

test('semantics', () => {
    expect(new MasterCSS(config).create('show')?.text).toBe('.show{display:block}')
    expect(new MasterCSS().create('gradient-text')?.text).toBe('.gradient-text{-webkit-text-fill-color:transparent;-webkit-background-clip:text;background-clip:text}')
    expect(new MasterCSS({
        semantics: {
            '@my-animation': {
                animation: '1s linear infinite rotate'
            }
        }
    }).add('@my-animation')?.text).toBe('@keyframes rotate{0%{transform:rotate(-360deg)}to{transform:none}}.\\@my-animation{animation:1s linear infinite rotate}')
    expect(new MasterCSS(config).create('hide-text')?.text).toBe('.hide-text{font-size:0px}')
    expect(new MasterCSS(config).create('zero')?.text).toBe('.zero{font-size:0px;height:0px}')
    expect(new MasterCSS().create('full')?.text).toBe('.full{width:100%;height:100%}')
})
