import Link from './Link';

export default function ALink(props: any) {
    return <Link {...props}>
        <a className={props.className}>{props.children}</a>
    </Link>;
}