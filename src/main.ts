import config from './config'
import getTargets from './targets'
import { Log, LogLevelFromString, StdioAdaptor } from '@edge/log'
import { clearInterval, setInterval } from 'timers'
import request, { Response } from './request'

const main = async () => {
  const adaptors = [new StdioAdaptor()]
  const log = new Log(adaptors)
  log.setLogLevel(LogLevelFromString(config.log.level))
  const requestLog = log.extend('request')

  log.info('starting')
  const targets = await getTargets()

  const requests = targets.map((t, i) => {
    const ms = i * config.delay
    return () => new Promise<Response>((resolve, reject) => {
      setTimeout(() => request(requestLog)(t).then(resolve).catch(reject), ms)
    })
  })

  let i: NodeJS.Timer | undefined = undefined
  let cycles = 0
  let locked = false
  const tick = async () => {
    if (locked) {
      log.warn('previous requests not completed, skipping tick')
      return
    }
    locked = true

    log.info('cycle')
    cycles++
    if (config.stop > 0 && cycles >= config.stop) {
      if (i) clearInterval(i)
    }

    try {
      const results = await Promise.allSettled(requests.map(r => r()))
      results.forEach(r => console.log(r))
    }
    catch (err) {
      log.error('critical error', { err })
      if (i) clearInterval(i)
    }
    finally {
      locked = false
    }
  }

  i = setInterval(tick, config.frequency)
  tick()
}

main()
