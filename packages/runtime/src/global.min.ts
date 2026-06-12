import initCSSRuntime from './init'
import themePlan from '@master/css/index.css?master-css-plan'

initCSSRuntime({ plan: window.masterCSSPlan || themePlan })
