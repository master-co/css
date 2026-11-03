import { useRouter } from 'next/router';
import LanguageSvg from '~/svgs/language.svg'

export default function LanguageButton() {
    const router = useRouter()
    return (
        <button className="headerIcon rel">
            <LanguageSvg width="20" height="20" fill="currentColor" />
            <select className='abs full opacity:0 cursor:inherit'
                onChange={async (event: any) => {
                    const { pathname, asPath, query } = router;
                    await router.push({ pathname, query }, asPath, {
                        locale: event.target.value,
                        scroll: false
                    });
                }}
                defaultValue={router.locale}>
                {router.locales?.map(eachLocale => <option key={eachLocale} value={eachLocale}>{
                    {
                        tw: '中文 (台灣)',
                        en: 'English'
                    }[eachLocale]
                }</option>)}
            </select>
        </button>
    )
}