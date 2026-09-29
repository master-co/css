import Image from 'next/image'
import Demo from '~/site/docs-shell/components/Demo'
import mobileImage from '~/site/public/images/landscape-mobile-screen.png'

export default () => (
  <Demo $py={0}>
    <div className="transition-property:transform transition-duration:0.2s transform:scale(1.1):hover">
      <Image
        src={mobileImage}
        className="max-height:319px max-width:480px pointer-events:none"
        priority={true}
        alt="hello world"
      />
      <div className="position:absolute inset:0 height:fit-content margin:auto mix-blend-mode:overlay animation-name:flash animation-duration:3s animation-iteration-count:infinite">
        <h1 className="margin:0 font-heavy font-size:7vw text-align:center fg-white font-5xl@xs">
          Hello, World!
        </h1>
      </div>
    </div>
  </Demo>
)
