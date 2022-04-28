const DEFAULT = -1

export type Event =
  'dns' |
  'download' |
  'response' |
  'ssl' |
  'start' |
  'tcp' |
  'ttfb'

export const Events: Event[] = [
  'dns',
  'download',
  'response',
  'ssl',
  'start',
  'tcp',
  'ttfb'
]

export type Result = Record<Event, number>

export type Timer = Record<Event, () => void> & { complete: () => Result }

const createTimer = (): Timer => {
  const result = Events.reduce((r, m) => {
    r[m] = DEFAULT
    return r
  }, <Result>{})

  const complete = () => ({ ...result })

  return Events.reduce((t, m) => {
    t[m] = () => {
      if (result[m] === DEFAULT) result[m] = Date.now()
    }
    return t
  }, <Timer>{ complete })
}

export default createTimer
