import { allPages } from '../../../pages'
import Link from 'shared/components/Link'
import { l } from 'to-line'

export default function Documents({ category, first }: any) {
    return <>
        <thead>
            <tr>
                <th colSpan={2} className={l({ 'pt:30': !first })}>{category}</th>
            </tr>
        </thead>
        <tbody>
            {allPages
                .filter(({ metadata }) => metadata.category === category)
                .map(({ metadata, pathname }) => (
                    <tr key={metadata.title as any}>
                        <td className='white-space:nowrap'>
                            <Link href={pathname} disabled={(metadata as any).disabled}>
                                <span className='mr:8'>{
                                    (metadata as any).unfinished
                                        ? '🚧'
                                        : (metadata as any).disabled ? '⚪️' : '🟢'
                                }</span>
                                <span className={l({ 'text:underline': !(metadata as any).disabled })}>{metadata.other?.subject || metadata.title}</span>
                            </Link>
                        </td>
                        <td><span className='lines:1'>{metadata.description}</span></td>
                    </tr>
                ))}
        </tbody>
    </>

}