import MasterCSSDarkSvg from '~/public/images/css-logotype@dark.svg';
import MasterCSSLightSvg from '~/public/images/css-logotype@light.svg';


function Logo({ series, name, hideLogoText }: any) {
    return (
        <a href={'/'} className="logo h:48 h:60@md align-items:center c:center flex">
            <MasterCSSDarkSvg viewBox="0 0 460 55" className="w:auto h:19 hide@light" id="header" />
            <MasterCSSLightSvg viewBox="0 0 460 55" className="w:auto h:19 hide@dark" id="header" />
        </a>
    )
}

export default Logo