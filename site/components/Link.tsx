import { default as NextLink } from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Link(props: any) {
    const router = useRouter();

    const getNewHref = () => {
        const { pathname } = router
        let newHref: string = pathname;

        if (props.href.startsWith('#') || props.href.startsWith('/#')) {
            newHref = pathname + props.href;
        } else if (props.href.startsWith('http') || props.href.startsWith('/')) {
            newHref = props.href;
        }
        return newHref;
    };

    const [href, setHref] = useState(getNewHref());

    useEffect(() => {
        setHref(getNewHref());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.href]);

    return <NextLink {...props} href={href} />;
}