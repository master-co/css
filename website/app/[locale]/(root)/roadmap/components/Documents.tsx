import { allPages } from '../../pages'
import Link from 'websites/components/Link'
import clsx from 'clsx'
import { AbsoluteTemplateString } from 'next/dist/lib/metadata/types/metadata-types'

export default function Documents({ category, first }: any) {
    return <>
        <thead>
            <tr>
                <th colSpan={2} className={clsx({ 'pt:30': !first })}>{category}</th>
            </tr>
        </thead>
        <tbody>
            {allPages
                .filter(({ metadata }) => metadata.category === category)
                .map(({ metadata, pathname }) => {
                    const subject = metadata.other?.subject as string || (metadata.title as AbsoluteTemplateString).absolute || (metadata.title as string)
                    return (
                        <tr key={subject}>
                            <td className='white-space:nowrap'>
                                <Link href={pathname} disabled={(metadata as any).disabled}>
                                    <span className='mr:8'>{
                                        (metadata as any).unfinished
                                            ? '🚧'
                                            : (metadata as any).disabled ? '⚪️' : '🟢'
                                    }</span>
                                    <span className={clsx({ 'text:underline': !metadata.disabled })}>{subject}</span>
                                </Link>
                            </td>
                            <td><span className='lines:1'>{metadata.description}</span></td>
                        </tr>
                    )
                })}
        </tbody>
    </>

}