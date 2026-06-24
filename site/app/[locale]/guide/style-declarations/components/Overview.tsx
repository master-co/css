import Image from 'next/image'
import Demo from 'internal/components/Demo'
import mobileImage from '~/site/public/images/landscape-mobile-screen.png'

export default () => (
    <Demo $py={0}>
        <div className="transition:transform|.2s transform:scale(1.1):hover">
            <Image
                src={mobileImage}
                className="untouchable max-h:319px max-w:480px"
                priority={true}
                alt="hello world"
            />
            <div className="abs animation:flash|3s|infinite inset:0 m:auto h:fit mix-blend-mode:overlay">
                <h1 className="text-center m:0 fg:white font:7vw font:heavy font:5xl@xs">
                    Hello, World!
                </h1>
            </div>
        </div>
    </Demo>
)
