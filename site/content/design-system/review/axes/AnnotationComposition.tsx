import { Demo, DemoAxes, DemoItem, DemoLegend, DemoMeasure, DemoSurface } from '~/site/components/demo'

export default function AnnotationComposition() {
  return <Demo frame="none" padding="none" title="Anatomy of a layout" caption={<DemoLegend items={[{ tone: 'blue', label: 'Subject' }, { tone: 'violet', label: 'Comparison' }, { tone: 'neutral', label: 'Context' }]} />}>
    <div className="review-axes-composition-shell">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- The diagram keeps its real width and needs a native keyboard scroll stop. */}
      <div className="review-axes-composition" role="region" aria-label="Annotated row with content bounds" tabIndex={0}>
        <div className="review-axes-composition-content"><DemoAxes>
      <DemoMeasure label="Container">
        <DemoSurface className="display:flex align-items:center gap-sm min-height:10rem p-md">
          <DemoItem tone="blue" className="flex:1 p-md text-align:center">01</DemoItem>
          <DemoItem tone="violet" className="flex:1 p-md text-align:center">02</DemoItem>
          <DemoItem tone="neutral" className="flex:1 p-md text-align:center">03</DemoItem>
        </DemoSurface>
      </DemoMeasure>
        </DemoAxes></div>
      </div>
    </div>
  </Demo>
}
