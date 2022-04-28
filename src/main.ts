import config from './config'
import getTargets from './targets'
import listen from './api'
import { Log, LogLevelFromString, StdioAdaptor } from '@edge/log'
import { clearInterval, setInterval } from 'timers'
import request, { Response } from './request'

const doRequests = async (log?: Log): Promise<void> => {
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
    const results = await Promise.allSettled(requests.map(r => r()))
    const ok = results.filter(r => r.status === 'fulfilled' )
    log?.info('completed requests', { num: ok.length, errors: requests.length - ok.length })
    ok.forEach(r => console.log(r))

    locked = false
  }

  i = setInterval(tick, config.frequency)
  tick()
}

const main = async () => {
  const adaptors = [new StdioAdaptor()]
  const log = new Log(adaptors)
  log.setLogLevel(LogLevelFromString(config.log.level))

  log.info('starting')
  try {
    await Promise.all([
      doRequests(log.extend('request')),
      listen(log.extend('http'))
    ])
  }
  catch (err) {
    log.error('critical error', { err })
  }
}

main()
