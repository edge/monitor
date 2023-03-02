import { Context } from './main'
import { Target } from './targets/types'
import request from './request'

export type CancelFunc = () => void

export type Dispatcher = ReturnType<typeof dispatcher>

export type Request = {
  target: Target
  cancel?: CancelFunc | undefined
}

const LOCK = 'dispatcher'

const dispatcher = (ctx: Context) => {
  const { config, lock, log, metrics } = ctx

  const pool: Request[] = []
  let started = false

  const send = async (req: Request) => {
    log.debug('sending request', req.target)
    try {
      const res = await request(ctx, req.target)
      metrics.record(res)
      log.info('request complete', req.target)
    }
    catch (err) {
      log.error('failed to send request', { ...req.target, err })
    }
  }

  const startRequest = (req: Request): CancelFunc | undefined => {
    if (req.target.enabled === false) {
      const { method, url } = req.target
      log.debug('ignoring disabled request', { method, url })
      return
    }

    const frequency = (req.target.frequency || config.request.frequency) * 1000
    send(req)
    const iv = setInterval(() => send(req), frequency)

    return () => {
      if (iv) clearInterval(iv)
    }
  }

  const start = () => lock.acquire(LOCK, () => {
    if (started) return
    started = true
    pool.forEach(req => {
      req.cancel = startRequest(req)
    })
    log.info('started')
  })

  const stop = () => lock.acquire(LOCK, () => {
    pool.forEach(req => req.cancel?.())
    started = false
    log.info('stopped')
  })

  const reload = () => lock.acquire(LOCK, async () => {
    const targets = await ctx.targets.get()
    while (pool.length > 0) pool.pop()
    for (const target of targets) pool.push({ target })
    log.info('reloaded')
  })

  return { reload, start, stop }
}

export default dispatcher
