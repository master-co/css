import { withSyntaxLayer } from '@master/css'
import RuntimeLayer from './layer'

const RuntimeSyntaxLayer = withSyntaxLayer(RuntimeLayer)

export declare type RuntimeSyntaxLayerInstance = InstanceType<typeof RuntimeSyntaxLayer>
export default RuntimeSyntaxLayer