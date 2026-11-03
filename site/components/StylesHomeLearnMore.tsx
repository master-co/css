import clsx from 'clsx';
import ChevronRightSvg from '~/svgs/chevron-right.svg';
import ALink from './ALink';
import Link from './Link';

export default function StylesHomeLearnMore({ children, className, href }: any) {
    return (
        <ALink href={href} className={clsx('homeLearnMore', className)}>
            {children}
            <ChevronRightSvg width="24" height="24" className="my:-4" fill="currentColor" />
        </ALink>
    )
}