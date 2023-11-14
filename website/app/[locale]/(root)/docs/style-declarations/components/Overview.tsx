import Image from 'next/image'
import Demo from 'websites/components/Demo'
import mobileImage from '~/public/images/landscape-mobile-screen.png'

export default () => (
    <Demo $py={0}>
        <div className="scale(1.1):hover ~transform|.2s">
            <Image
                src={mobileImage}
                className="untouchable max:480x319"
                priority={true}
                alt="hello world"
            />
            <h1 className="abs inset:0 m:auto height:fit text:center font:7vw font:40@xs font:heavy fg:white blend:overlay @flash|3s|infinite">
                Hello, World!
            </h1>
        </div>
    </Demo>
)