import Tester from '../tester'

new Tester().classText({
    'block@print': '@media print{.block\\@print{display:block}}',
    'block@md&<lg': '@media (width>=64rem) and (width<80rem){.block\\@md\\&\\<lg{display:block}}',
})