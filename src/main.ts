import config from './config'
import getTargets from './targets'
import listen from './api'
import { Log, LogLevelFromString, StdioAdaptor } from '@edge/log'
import { clearInterval, setInterval } from 'timers'
import createMetrics, { Metrics } from './metrics'
import request, { Response } from './request'

const doRequests = async (metrics: Metrics, log?: Log): Promise<void> => {
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
      const { headers, result } = await r()
      const labels = [headers.contentType, headers.cache]
      metrics.contentLength.labels(...labels).inc(parseInt(headers.contentLength))
      metrics.download.labels(...labels).inc(result.download - result.ttfb)
      metrics.requests.labels(...labels).inc()
      metrics.ttfb.labels(...labels).inc(result.ttfb - result.start)
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

const main = async () => {
  const adaptors = [new StdioAdaptor()]
  const log = new Log(adaptors)
  log.setLogLevel(LogLevelFromString(config.log.level))

  const metrics = createMetrics()

  log.info('starting')
  try {
    await Promise.all([
      doRequests(metrics, log.extend('request')),
      listen(metrics, log.extend('http'))
    ])
  }
  catch (err) {
    log.error('critical error', { err })
  }
}

main()
