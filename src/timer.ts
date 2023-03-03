// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

/** Placeholder time value, to disambiguate unmeasured from measured values. */
const DEFAULT_TIME = BigInt(-1)

/** Relative to nanoseconds. `1e6` provides millisecond precision when calculating time elapsed */
const SCALE = 1e6

/**
 * Timed events relating to an HTTP GET request.
 * These should occur in the following order:
 *   1. `start` (always zero)
 *   2. `dns`
 *   3. `tcp`
 *   4. `ssl` (if HTTPS)
 *   5. `ttfb`
 *   6. `download`
 */
export type Event =
  'dns' |
  'download' |
  'ssl' |
  'start' |
  'tcp' |
  'ttfb'

/** Timed events as a usable array. */
export const Events: Event[] = [
  'dns',
  'download',
  'ssl',
  'start',
  'tcp',
  'ttfb'
]

/** Timing result created when a timer is completed. See `Timer.complete()` */
export type Result = {
  start: number
  end: number
  abs: Record<Event, bigint>
  delta: Record<Event, number>
  total: Record<Event, number>
}

/**
 * A timer provides a simple interface to record HTTP request events as it progresses.
 * Each `Event` function captures the time in nanoseconds.
 * Calling an `Event` function more than once has no effect.
 * Calling `complete()` summarises the timings into a `Result` used for metrics.
 */
export type Timer = Record<Event, () => void> & { complete: () => Result }

const calculate = (r: Result): Result => {
  if (r.abs.ssl < 0) r.abs.ssl = r.abs.tcp

  r.total.dns = elapsed(r.abs.start, r.abs.dns)
  r.total.tcp = elapsed(r.abs.start, r.abs.tcp)
  r.total.ssl = elapsed(r.abs.start, r.abs.ssl)
  r.total.ttfb = elapsed(r.abs.start, r.abs.ttfb)
  r.total.download = elapsed(r.abs.start, r.abs.download)

  r.delta.dns = elapsed(r.abs.start, r.abs.dns)
  r.delta.tcp = elapsed(r.abs.dns, r.abs.tcp)
  r.delta.ssl = elapsed(r.abs.tcp, r.abs.ssl)
  r.delta.ttfb = elapsed(r.abs.ssl, r.abs.ttfb)
  r.delta.download = elapsed(r.abs.ttfb, r.abs.download)

  return r
}

/** Create a timer. */
const timer = (): Timer => {
  const result = Events.reduce((r, m) => {
    r.abs[m] = DEFAULT_TIME
    r.delta[m] = 0
    r.total[m] = 0
    return r
  }, <Result>{ start: Date.now(), abs: {}, delta: {}, total: {} })

  const complete = () => {
    result.end = Date.now()
    return calculate(result)
  }

  return Events.reduce((t, m) => {
    t[m] = () => {
      if (result.abs[m] === DEFAULT_TIME) result.abs[m] = process.hrtime.bigint()
    }
    return t
  }, <Timer>{ complete })
}

const elapsed = (from: bigint, to: bigint): number => Math.round(Number(to - from) / SCALE)

export default timer
