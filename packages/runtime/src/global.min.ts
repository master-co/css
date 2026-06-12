import initCSSRuntime from './init'
import defaultPlan from '@master/css-preset/default-plan'

initCSSRuntime({ plan: window.masterCSSPlan || defaultPlan })
