import { dataProps } from './data-props'
import { featureProps } from './feature-props'
import { styleProps } from './style-props'

export const chartProps = {
  ...dataProps,
  ...styleProps,
  ...featureProps
}
