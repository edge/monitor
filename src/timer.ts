/** Placeholder time value, to disambiguate unmeasured from measured values. */
const DEFAULT_TIME = BigInt(-1)
/** Relative to nanoseconds. `1e3` provides microsecond precision when calculating time elapsed */
const SCALE = 1e3

export type Event =
  'dns' |
  'download' |
  'ssl' |
  'start' |
  'tcp' |
  'ttfb'

export const Events: Event[] = [
  'dns',
  'download',
  'ssl',
  'start',
  'tcp',
  'ttfb'
]

export type Result = {
  abs: Record<Event, bigint>
  delta: Record<Event, number>
  total: Record<Event, number>
}

export type Timer = Record<Event, () => void> & { complete: () => Result }

const calculate = (r: Result) => (): Result => {
  r.total.dns = elapsed(r.abs.start, r.abs.dns)
  r.total.tcp = elapsed(r.abs.start, r.abs.tcp)
  if (r.abs.ssl) r.total.ssl = elapsed(r.abs.start, r.abs.ssl)
  r.total.ttfb = elapsed(r.abs.start, r.abs.ttfb)
  r.total.download = elapsed(r.abs.start, r.abs.download)

  r.delta.dns = elapsed(r.abs.start, r.abs.dns)
  r.delta.tcp = elapsed(r.abs.dns, r.abs.tcp)
  if (r.abs.ssl) {
    r.delta.ssl = elapsed(r.abs.tcp, r.abs.ssl)
    r.delta.ttfb = elapsed(r.abs.ssl, r.abs.ttfb)
  }
  else {
    r.delta.ttfb = elapsed(r.abs.tcp, r.abs.ttfb)
  }
  r.delta.download = elapsed(r.abs.ttfb, r.abs.download)

  return r
}

const createTimer = (): Timer => {
  const result = Events.reduce((r, m) => {
    r.abs[m] = DEFAULT_TIME
    r.delta[m] = 0
    r.total[m] = 0
    return r
  }, <Result>{ abs: {}, delta: {}, total: {} })

  const complete = calculate(result)

  return Events.reduce((t, m) => {
    t[m] = () => {
      if (result.abs[m] === DEFAULT_TIME) result.abs[m] = process.hrtime.bigint()
    }
    return t
  }, <Timer>{ complete })
}

const elapsed = (from: bigint, to: bigint): number => Math.round(Number(to - from) / SCALE)

export default createTimer
