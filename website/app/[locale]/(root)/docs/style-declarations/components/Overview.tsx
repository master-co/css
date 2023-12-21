import Image from 'next/image'
import Demo from 'websites/components/Demo'
import mobileImage from '~/public/images/landscape-mobile-screen.png'

export default () => (
    <Demo $py={0}>
        <div className="~transform|.2s scale(1.1):hover">
            <Image
                src={mobileImage}
                className="untouchable max:480|319"
                priority={true}
                alt="hello world"
            />
            <h1 className="abs @flash|3s|infinite blend:overlay fg:white font:7vw font:40@xs font:heavy height:fit inset:0 m:auto text:center">
                Hello, World!
            </h1>
        </div>
    </Demo>
)