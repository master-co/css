import Demo from '~/site/components/demo/Demo'
import { DemoDark, DemoLight } from '~/site/components/demo/DemoMode'

export function SurfacesDemo() {
  return (
    <Demo padding="none" className="display:flex container-type:inline-size flex-wrap:wrap">
      <DemoLight>
        <div className="display:grid place-content:center height:3rem width:100% aspect-ratio:2/1 r-sm bg-surface-base shadow-lg"></div>
      </DemoLight>
      <DemoDark>
        <div className="display:grid place-content:center height:3rem width:100% aspect-ratio:2/1 r-sm bg-surface-base shadow-lg"></div>
      </DemoDark>
    </Demo>
  )
}

export function LineRolesDemo() {
  function renderPreview() {
    return (
      <div className="height:6rem width:6rem r-sm border-width:1.25rem border-style:solid b-line-divider"></div>
    )
  }

  return (
    <Demo padding="none" className="display:flex container-type:inline-size flex-wrap:wrap">
      <DemoLight>{renderPreview()}</DemoLight>
      <DemoDark>{renderPreview()}</DemoDark>
    </Demo>
  )
}

export function BaseHueDemo() {
  return (
    <Demo padding="none" className="display:flex container-type:inline-size flex-wrap:wrap">
      <DemoLight>
        <div className="display:grid place-content:center height:3rem width:100% aspect-ratio:2/1 r-sm bg-yellow"></div>
      </DemoLight>
      <DemoDark>
        <div className="display:grid place-content:center height:3rem width:100% aspect-ratio:2/1 r-sm bg-yellow"></div>
      </DemoDark>
    </Demo>
  )
}

export function TextHueDemo() {
  return (
    <Demo padding="none" className="display:flex container-type:inline-size flex-wrap:wrap">
      <DemoLight>
        <div className="font-9xl font-heavy fg-text-yellow">M</div>
      </DemoLight>
      <DemoDark>
        <div className="font-9xl font-heavy fg-text-yellow">M</div>
      </DemoDark>
    </Demo>
  )
}

export function TextRolesDemo() {
  function renderPreview() {
    return (
      <div className="display:grid gap-xs width:100% max-w-3xs p-lg r-sm font-semibold text-align:center bg-surface-raised fg-text-body shadow-lg">
        <div className="font-md font-semibold fg-text-strong">Quarterly report</div>
        <p className="margin:0 fg-text-body">Revenue is on track for the current cycle.</p>
        <p className="margin:0 text-sm fg-text-muted">Updated 12 minutes ago</p>
        <button className="text-sm fg-text-disabled" disabled>Archived export unavailable</button>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a className="text-decoration:underline fg-text-link fg-text-link-hover:hover" href="#">Open report</a>
        <div className="width:fit-content margin-inline:auto mt-sm py-xs px-sm r-sm bg-surface-inverse fg-text-inverse">Private note</div>
      </div>
    )
  }

  return (
    <Demo padding="none" className="display:flex container-type:inline-size flex-wrap:wrap">
      <DemoLight>{renderPreview()}</DemoLight>
      <DemoDark>{renderPreview()}</DemoDark>
    </Demo>
  )
}
