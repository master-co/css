import Image from '~/site/docs-shell/components/Image'
import Demo from '~/site/components/demo/Demo'
import mobileImage from '~/site/public/images/landscape-mobile-screen.png'

export default () => (
  <Demo padding="none" className="padding-inline:2rem padding-inline:3rem@sm">
    <div className="transition-duration:0.2s transition-property:transform transform:scale(1.1):hover">
      <Image
        src={mobileImage}
        className="max-height:319px max-width:480px pointer-events:none"
        priority={true}
        alt="hello world"
      />
      <div className="position:absolute inset:0 height:fit-content margin:auto mix-blend-mode:overlay animation-duration:3s animation-iteration-count:infinite animation-name:flash">
        <h1 className="margin:0 font-heavy font-size:7vw text-align:center fg-white font-5xl@xs">
          Hello, World!
        </h1>
      </div>
    </div>
  </Demo>
)
