import {
  Demo, DemoAxes, DemoComparison, DemoItem, DemoLabel, DemoLegend, DemoMeasure,
  DemoMedia, DemoSurface, DemoSwatch, DemoText
} from '~/site/components/demo'

export default function DemoFoundations() {
  return (
    <div className="demo-foundations">
      <div className="demo-principle"><span>01</span><div><strong>Quiet canvas</strong><p>Structure recedes. The behavior stays in focus.</p></div></div>
      <div className="demo-principle"><span>02</span><div><strong>Honest geometry</strong><p>Real CSS, real boundaries, useful annotations.</p></div></div>
      <div className="demo-principle"><span>03</span><div><strong>One visual language</strong><p>A consistent system across every reference.</p></div></div>
      <Demo title="Canvas backgrounds" padding="none">
        <div className="demo-background-grid">
          {(['stripes', 'plain', 'grid', 'dots', 'checkerboard'] as const).map(background => (
            <div key={background} className="p:lg demo-canvas" data-background={background}>
              <DemoItem className="mb:sm p:md text-center" tone="neutral">Aa</DemoItem>
              <DemoLabel>{background}</DemoLabel>
            </div>
          ))}
        </div>
      </Demo>
      <Demo title="Semantic color roles" caption="Blue identifies the subject; violet identifies a comparison. Every color is paired with a label.">
        <div className="demo-specimen-grid">
          <DemoSwatch label="Canvas" value="demo-canvas" className="bg:demo-canvas" />
          <DemoSwatch label="Surface" value="demo-surface" className="bg:demo-surface" />
          <DemoSwatch label="Subject" value="demo-blue" className="bg:demo-blue" />
          <DemoSwatch label="Comparison" value="demo-violet" className="bg:demo-violet" />
        </div>
      </Demo>
    </div>
  )
}

export function DemoPrimitives() {
  return (
    <>
      <Demo title="Objects" caption="Items provide paint. Their parent supplies layout, spacing and dimensions.">
        <div className="demo-specimen-grid">
          {(['soft', 'solid', 'outline', 'ghost'] as const).map(variant => <div key={variant}><DemoItem variant={variant} className="mb:xs p:lg text-center">01</DemoItem><DemoLabel>{variant}</DemoLabel></div>)}
        </div>
      </Demo>
      <Demo title="Object tones">
        <div className="demo-specimen-grid">
          {(['blue', 'violet', 'neutral', 'amber'] as const).map(tone => <DemoItem key={tone} tone={tone} className="p:md text-center"><DemoLabel>{tone}</DemoLabel></DemoItem>)}
        </div>
      </Demo>
      <Demo title="Content specimens">
        <DemoComparison>
          <DemoSurface className="p:md"><DemoLabel>TEXT</DemoLabel><DemoText variant="lead" className="mt:sm">Form follows function.</DemoText><DemoText variant="caption" className="mt:xs">Use meaningful content to make layout decisions visible.</DemoText></DemoSurface>
          <DemoSurface className="p:md"><DemoLabel>MEDIA</DemoLabel><DemoMedia className="w:full mt:sm r:sm" /><DemoMedia src="/demo/landscape.svg" alt="Sun above layered mountains" className="w:full mt:sm r:sm" /></DemoSurface>
        </DemoComparison>
      </Demo>
      <Demo title="Comparison" caption="Equal specimens isolate the change being taught.">
        <DemoComparison>
          <div><DemoLabel>Default</DemoLabel><DemoItem tone="neutral" className="mt:xs p:lg">Layer 01</DemoItem></div>
          <div><DemoLabel>With utility</DemoLabel><DemoItem tone="violet" className="mt:xs p:lg r:xl">Layer 01</DemoItem></div>
        </DemoComparison>
      </Demo>
    </>
  )
}

export function DemoAnnotations() {
  return (
    <Demo title="Anatomy of a layout" caption={<DemoLegend items={[{ tone: 'blue', label: 'Subject' }, { tone: 'violet', label: 'Comparison' }, { tone: 'neutral', label: 'Context' }]} />}>
      <DemoAxes>
        <DemoMeasure label="Container">
          <DemoSurface className="flex items-center gap:sm min-h:40x p:md">
            <DemoItem tone="blue" className="flex:1 p:md text-center">01</DemoItem>
            <DemoItem tone="violet" className="flex:1 p:md text-center">02</DemoItem>
            <DemoItem tone="neutral" className="flex:1 p:md text-center">03</DemoItem>
          </DemoSurface>
        </DemoMeasure>
      </DemoAxes>
    </Demo>
  )
}
