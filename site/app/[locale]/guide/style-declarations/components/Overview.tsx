import Image from 'next/image'
import Demo from 'internal/components/Demo'
import mobileImage from '~/site/public/images/landscape-mobile-screen.png'

export default () => (
    <Demo $py={0}>
        <div className="~transform|.2s scale(1.1):hover">
            <Image
                src={mobileImage}
                className="untouchable max:480|319"
                priority={true}
                alt="hello world"
            />
            <div className="abs @flash|3s|infinite inset:0 m:auto blend:overlay height:fit">
                <h1 className="m:0 fg:white font:7vw font:heavy text:center font:40@xs">
                    Hello, World!
                </h1>
            </div>
        </div>
    </Demo>
)