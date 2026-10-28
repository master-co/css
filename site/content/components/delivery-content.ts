/**
 * The one page every rendering mode delivers in the Rendering section: a component's markup and a
 * class that page code adds after load. The class is in the source, so a static build scans it, but
 * it is not in the rendered HTML, so a progressive page starts its engine for it. Each class has a
 * visible effect on the page and a rule short enough to read whole in a station.
 */
export const deliveryMarkup = [
  { tag: 'section', className: 'p-lg r-xl shadow-lg' },
  { tag: 'h2', className: 'font-sm', text: 'Plans', indent: 1 },
  { tag: 'ul', className: 'display:flex gap-md', text: '…', indent: 1 }
] as const

export const deliveryLateClass = 'bg-yellow'

/** The plan the script selects, and the plans in the list. */
export const deliveryPlans = ['Free', 'Pro', 'Team'] as const
export const deliveryLatePlan = 1

/** Classes in source order: the rendered markup first, then the class the script adds. */
export const deliveryRenderedClasses = deliveryMarkup.flatMap((line) => line.className.split(' '))
export const deliverySourceClasses = [...deliveryRenderedClasses, deliveryLateClass]

/** Where CSS can be produced: the stage's columns, left to right. */
export const deliveryStations = [
  { id: 'build', label: 'Build' },
  { id: 'server', label: 'Server' },
  { id: 'browser', label: 'Browser' }
] as const

/** The moments on the section's timeline, in order. */
export const deliveryMoments = [
  { id: 'build', label: 'Build' },
  { id: 'response', label: 'Response' },
  { id: 'paint', label: 'First paint' },
  { id: 'later', label: 'New class' }
] as const
