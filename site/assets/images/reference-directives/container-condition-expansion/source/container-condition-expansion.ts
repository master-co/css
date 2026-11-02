import { referenceIllustrations } from '../../../../../reference/illustrations'
import { drawing, type Theme } from '../../../rendering-modes/source/materials'

// The two highlighted identities survive substitution: a name stays a name;
// the named condition becomes its expanded expression. This is not a DOM diagram.
export default {
  id: 'container-condition-expansion',
  render(theme: Theme) {
    const { text, codeParts, route, scene } = drawing(theme)
    const figure = referenceIllustrations['container-condition-expansion']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>.annotated-code .code { white-space:pre; }</style>
      ${text(60, 38, l.definition, 'edge')}
      ${text(60, 70, l.width, 'code')}
      ${text(60, 102, l.dense, 'code')}
      ${text(84, 132, l.expression, 'code')}
      ${text(360, 200, l.use, 'edge', 'center')}
      ${codeParts(360, 234, [{value:'@container '},{id:'chosen',value:'card',tone:'blue'},{value:' '},{id:'named',value:'(--dense)',tone:'violet'}])}
      ${route('M360 276V316')}
      ${codeParts(360, 338, [{value:'@container '},{id:'kept',value:'card',tone:'blue'},{value:' '},{id:'expanded',value:l.expanded,tone:'violet'}])}
      ${text(360, 386, l.result, 'edge', 'center')}
      ${text(360, 438, l.scope, 'edge', 'center')}
    `)
  }
}
