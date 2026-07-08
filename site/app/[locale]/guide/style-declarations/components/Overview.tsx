import Image from 'next/image'
import Demo from 'internal/components/Demo'
import mobileImage from '~/site/public/images/landscape-mobile-screen.png'

export default () => (
  <Demo $py={0}>
    <div className="transition:transform|.2s transform:scale(1.1):hover">
      <Image
        src={mobileImage}
        className="max-h:319px max-w:480px untouchable"
        priority={true}
        alt="hello world"
      />
      <div className="abs inset:0 h:fit m:auto mix-blend-mode:overlay animation:flash|3s|infinite">
        <h1 className="m:0 font:7vw font:heavy text-center fg:white font:5xl@xs">
          Hello, World!
        </h1>
      </div>
    </div>
  </Demo>
)
