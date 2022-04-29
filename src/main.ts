// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import config from './config'
import getTargets from './targets'
import listen from './api'
import { Log, LogLevelFromString, StdioAdaptor } from '@edge/log'
import { clearInterval, setInterval } from 'timers'
import createMetrics, { Metrics } from './metrics'
import request, { Response } from './request'

/**
 * Start a repeating request process.
 * This reads targets from configuration, then sequentially performs HTTP GET requests to their URLs following a
 * regular schedule.
 * A cycle (tick) occurs every `FREQUENCY` seconds, and each request in a cycle is separated by `DELAY` milliseconds.
 * The total number of cycles can be constrained to `STOP` - if this is 0 or unset, the cycle continues indefinitely.
 *
 * If any request in a given cycle is incomplete when the next cycle is scheduled to start, that cycle is skipped.
 * In effect, while requests are individually asynchronous, cycles are synchronous, preventing any target being
 * requested again when another request for it may be yet to complete.
 * **This behaviour may change in future.**
 */
const doRequests = async (rcv: (r: Response) => void, log?: Log): Promise<void> => {
  const targets = await getTargets()
  const doRequest = request(log)

  const requests = targets.map((t, i) => {
    const ms = i * config.delay
    return () => new Promise<Response>((resolve, reject) => {
      setTimeout(() => doRequest(t).then(resolve).catch(reject), ms)
    })
  })

  let i: NodeJS.Timer | undefined = undefined
  let cycles = 0
  let locked = false
  const tick = async () => {
    if (locked) {
      log?.warn('previous requests not completed, skipping tick')
      return
    }
    locked = true

    cycles++
    if (config.stop > 0 && cycles >= config.stop) {
      if (i) clearInterval(i)
    }

    log?.info('sending requests', { num: requests.length })
    const completed = await Promise.allSettled(requests.map(async r => {
      const result = await r()
      rcv(result)
    }))
    const errors = completed.filter(r => r.status === 'rejected')
    log?.info('completed requests', { num: completed.length - errors.length, errors: errors.length })
    errors.forEach(r => {
      log?.warn('failed to complete request', { reason: (r as PromiseRejectedResult).reason })
    })

    locked = false
  }

  i = setInterval(tick, config.frequency)
  tick()
}

/** Update metrics from a timed response. */
const updateMetrics = (metrics: Metrics) => ({ target, headers, result }: Response) => {
  const resourceLabels = [target.name || target.url, headers.cache]
  metrics.resource.contentLength.labels(...resourceLabels).inc(parseInt(headers.contentLength))
  metrics.resource.dns.labels(...resourceLabels).inc(result.delta.dns)
  metrics.resource.download.labels(...resourceLabels).inc(result.delta.download)
  metrics.resource.requests.labels(...resourceLabels).inc()
  metrics.resource.ssl.labels(...resourceLabels).inc(result.delta.ssl)
  metrics.resource.tcp.labels(...resourceLabels).inc(result.delta.tcp)
  metrics.resource.ttfb.labels(...resourceLabels).inc(result.delta.ttfb)

  const typeLabels = [headers.contentType.startsWith('image/') ? 'image' : 'other', headers.cache]
  metrics.type.contentLength.labels(...typeLabels).inc(parseInt(headers.contentLength))
  metrics.type.dns.labels(...typeLabels).inc(result.delta.dns)
  metrics.type.download.labels(...typeLabels).inc(result.delta.download)
  metrics.type.requests.labels(...typeLabels).inc()
  metrics.type.ssl.labels(...typeLabels).inc(result.delta.ssl)
  metrics.type.tcp.labels(...typeLabels).inc(result.delta.tcp)
  metrics.type.ttfb.labels(...typeLabels).inc(result.delta.ttfb)
}

const main = async () => {
  const adaptors = [new StdioAdaptor()]
  const log = new Log(adaptors)
  log.setLogLevel(LogLevelFromString(config.log.level))

  const metrics = createMetrics()
  const rcv = updateMetrics(metrics)

  log.info('starting')
  let cancel: () => void = () => void 0
  try {
    let httpListen: Promise<void>
    [cancel, httpListen] = listen(metrics, log.extend('http'))
    await Promise.all([
      doRequests(rcv, log.extend('request')),
      httpListen
    ])
  }
  catch (err) {
    log.error('critical error', { err })
  }
  finally {
    cancel()
  }
}

main()
