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
            <div className="abs @flash|3s|infinite blend:overlay height:fit inset:0 m:auto">
                <h1 className="fg:white font:7vw font:40@xs font:heavy m:0 text:center">
                    Hello, World!
                </h1>
            </div>
        </div>
    </Demo>
)