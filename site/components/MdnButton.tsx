import clsx from 'clsx';
import Image from "next/image";
import { useRouter } from "next/router";

const url = 'https://developer.mozilla.org/en-US/docs/Web/CSS/';

export default function MdnButton({ src, className, width, height }: any) {

    const router = useRouter();
    if (typeof src === 'string') {
        if (!src.startsWith('http')) {
            src = url + src;
        }
    } else {
        const paths = router.asPath.split('/');
        src = url + paths.pop()?.split('?')[0].split('#')[0];
    }

    return <a href={src} target="blank" className={clsx(className, 'overflow:hidden inline-flex')}>
        <Image src="/images/mdn.favicon.png" layout='fixed' width={width} height={height} alt="Can I use ?" />
    </a>;
}