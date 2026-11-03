import ReactSvg from '~/public/images/frameworks/react.svg';
import AngularSvg from '~/public/images/frameworks/angular.svg';
import NextjsSvg from '~/public/images/frameworks/nextjs.svg';
import LaravelSvg from '~/public/images/frameworks/laravel.svg';
import NuxtjsSvg from '~/public/images/frameworks/nuxtjs.svg';
import VuejsSvg from '~/public/images/frameworks/vue.js.svg';
import RemixSvg from '~/public/images/frameworks/remix.svg';
import SvelteSvg from '~/public/images/frameworks/svelte.svg';
import AstroSvg from '~/public/images/frameworks/astro.svg';
import IonicSvg from '~/public/images/frameworks/ionic.svg';
// import BlazorSvg from '~/public/images/frameworks/blazor.svg';

export const frameworks = [
    { name: 'React', Logo: ReactSvg, class: 'scale(.85)' },
    { name: 'Angular', Logo: AngularSvg, class: 'scale(1.05)' },
    { name: 'Vue.js', Logo: VuejsSvg, class: 'scale(.85)' },
    { name: 'Svelte', Logo: SvelteSvg, class: 'scale(.85)' },
    { name: 'Next.js', Logo: NextjsSvg, class: 'scale(1.3) invert(1)@dark' },
    { name: 'Nuxt.js', Logo: NuxtjsSvg, class: 'scale(1.4)' },
    { name: 'Remix', Logo: RemixSvg, class: 'scale(1.2) invert(1)@dark' },
    { name: 'Laravel', Logo: LaravelSvg, class: 'scale(.8)' },
    { name: 'Astro', Logo: AstroSvg, class: 'scale(1.2)' },
    { name: 'Ionic', Logo: IonicSvg, class: 'scale(.85)' },
    // { name: 'Blazor', Logo: BlazorSvg, class: 'scale(1.05)' },
]