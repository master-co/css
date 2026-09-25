import dedent from 'ts-dedent'
import i18n from '../common/i18n.config.js'
import FontStyle from '../components/FontStyle'

declare type Props = {
  locale: typeof i18n.locales[number];
} & React.HTMLAttributes<HTMLHtmlElement>;

export default async function HTML({ locale, ...props }: Props) {
  return (
    <html {...props}
      lang={locale}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="any" />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <script blocking="render" dangerouslySetInnerHTML={{
          __html: dedent`
          const preference = localStorage.getItem('theme-preference') || 'system';
          const value = preference === 'system'
            ? matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'
            : preference;
          document.documentElement.classList.add(value);
          if (['dark', 'light'].includes(value)) document.documentElement.style.colorScheme = value;
        ` }}></script>
        <FontStyle locale={locale} />
      </head>
      {props.children}
    </html>
  )
}