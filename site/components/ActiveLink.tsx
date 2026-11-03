import { useState, useEffect, cloneElement } from 'react';
import { useRouter } from 'next/router';
import Link from '~/components/Link';
import React, { Children } from 'react';
import { getUrlPrefix } from '~/utils/getUrlPrefix';

const ActiveLink = ({ children, activeClassName, ...props }: any) => {
    const { asPath, isReady, query } = useRouter()

    const child = Children.only(children)
    const childClassName = child.props.className || ''
    const [className, setClassName] = useState(childClassName)

    useEffect(() => {
        // Check if the router fields are updated client-side
        if (isReady) {
            let linkPathname = new URL(props.as || props.href, location.href).pathname;
            if (query.locale) {
                linkPathname = '/' + query.locale + linkPathname;
            }

            // Using URL().pathname to get rid of query and hash
            const activePathname = new URL(asPath, location.href).pathname;

            const newClassName =
                linkPathname === activePathname
                    ? `${childClassName} ${activeClassName}`.trim()
                    : childClassName

            if (newClassName !== className) {
                setClassName(newClassName)
            }
        }
    }, [asPath, isReady, props.as, props.href, childClassName, activeClassName, setClassName, className, query.locale])

    return (
        <Link {...props}>
            {cloneElement(child, {
                className: className || null,
            })}
        </Link>
    )
}

export default ActiveLink