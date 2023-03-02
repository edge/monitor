import AsyncLock from 'async-lock'
import api from './api'
import { Log, LogLevelFromString, StdioAdaptor } from '@edge/log'
import dispatcher, { Dispatcher } from './dispatcher'
import metrics, { Metrics } from './metrics'
import targets, { TargetsModel } from './targets/db'

export type Config = {
  http: {
    port: number
  }
  log: {
    level: string
  }
  public: {
    path: string
  }
  request: {
    frequency: number
    timeout: number
  }
  targets: {
    path: string
  }
  ui: {
    enabled: boolean
  }
}

export type Context = {
  config: Config
  dispatcher: Dispatcher
  lock: AsyncLock
  log: Log
  metrics: Metrics
  targets: TargetsModel
}

const createLogger = ({ config }: Context) => {
  const adaptors = [new StdioAdaptor()]
  const log = new Log(adaptors)
  log.setLogLevel(LogLevelFromString(config.log.level))
  return log
}

const main = async (config: Config) => {
  const ctx = <Context>{ config }

  ctx.lock = new AsyncLock()
  ctx.log = createLogger(ctx)

  ctx.metrics = metrics()

  ctx.targets = targets({ ...ctx, log: ctx.log.extend('targets') })
  await ctx.targets.read()

  ctx.dispatcher = dispatcher({ ...ctx, log: ctx.log.extend('dispatcher') })
  await ctx.dispatcher.reload()
  await ctx.dispatcher.start()

  api({ ...ctx, log: ctx.log.extend('api') })

  await new Promise(() => void 0)
}

export default main
