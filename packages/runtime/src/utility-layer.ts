import withUtilityLayer from '@master/css-engine/factories/with-utility-layer'
import RuntimeLayer from './layer'

const RuntimeUtilityLayer = withUtilityLayer(RuntimeLayer)

export declare type RuntimeUtilityLayerInstance = InstanceType<typeof RuntimeUtilityLayer>
export default RuntimeUtilityLayer
