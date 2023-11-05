import { GridsBg } from 'websites-shared/components/GridsBg';
import Article from 'websites-shared/components/Article';
import DocHeader from '~/layouts/DocHeader';
import DocFooter from '~/layouts/DocFooter';
import ListAuthors from 'websites-shared/components/ListAuthors';
import { queryDictionary } from 'websites-shared/dictionaries';
import dayjs from 'dayjs';
import TimeAgo from 'websites-shared/components/TimeAgo';

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    const date = new Date(props.metadata.date)
    // const formattedDate = dayjs(date).format('dddd, MMMM D YYYY')
    return <>
        {/* @ts-expect-error server component */}
        <DocHeader locale={props.params.locale} contained />
        <GridsBg className="abs h:352 left:0 top:97 top:60@lg w:full z:-1" />
        <div className='mb:-20 mt:180 mx:auto max-w:md'>
            <div className='fg:accent font:semibold mb:10 text:center'>
                {props.metadata.date && <TimeAgo timestamp={props.metadata.date} locale={props.params.locale} />}
            </div>
            <h1 className='bg:text bg:linear-gradient(180deg,gray-45,gray-10) bg:linear-gradient(180deg,gray-90,gray-60)@dark font:64@sm font:heavy ls:-.5 m:0 text:center text-fill:transparent'>
                {$(props.metadata.title)}
            </h1>
            {props.metadata.authors && <ListAuthors className="center-content gap:30 mt:50">{props.metadata.authors}</ListAuthors>}
        </div>
        <main className='max-w:sm app-doc-main'>
            <Article className="mb:80 mt:0>:first" type="article">
                {props.children}
            </Article>
        </main>
    </>


}