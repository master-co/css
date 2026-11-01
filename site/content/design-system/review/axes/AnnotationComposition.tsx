import { Demo, DemoAxes, DemoItem, DemoLegend, DemoMeasure, DemoSurface } from '~/site/components/demo'

export default function AnnotationComposition() {
  return <Demo title="Anatomy of a layout" background="grid" caption={<DemoLegend items={[{ tone: 'blue', label: 'Subject' }, { tone: 'violet', label: 'Comparison' }, { tone: 'neutral', label: 'Context' }]} />}>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- The diagram keeps its real width and needs a native keyboard scroll stop. */}
    <div className="overflow-x-auto w-full" role="region" aria-label="Annotated row with content bounds" tabIndex={0}>
      <DemoAxes className="(min-width:22rem)">
        <DemoMeasure label="Container">
          <DemoSurface elevation="raised" className="flex items-center gap-sm (min-height:9rem) p-md">
            <DemoItem tone="blue" className="(flex:1)">01</DemoItem>
            <DemoItem tone="violet" className="(flex:1)">02</DemoItem>
            <DemoItem className="(flex:1)">03</DemoItem>
          </DemoSurface>
        </DemoMeasure>
      </DemoAxes>
    </div>
  </Demo>
}
