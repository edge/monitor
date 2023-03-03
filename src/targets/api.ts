import { Context } from '../main'
import { RequestHandler } from 'express'

export const getStatus = (ctx: Context): RequestHandler => (req, res, next) => {
  try {
    const reqs = ctx.dispatcher.getPool()
    const data = reqs.reduce((o, { target, lastResult }) => {
      if (lastResult instanceof Error) {
        o[target.hash] = { error: lastResult.message }
      }
      else if (typeof lastResult === 'object') {
        o[target.hash] = {
          start: lastResult.start,
          end: lastResult.end,
          delta: lastResult.delta,
          total: lastResult.total
        }
      }
      return o
    }, <Record<string, unknown>>{})
    res.json(data)
    next()
  }
  catch (err) {
    next(err)
  }
}

export const getTargets = (ctx: Context): RequestHandler => async (req, res, next) => {
  try {
    const targets = await ctx.targets.get()
    res.json(targets)
    next()
  }
  catch (err) {
    next(err)
  }
}

export const setTargets = (ctx: Context): RequestHandler => async (req, res, next) => {
  try {
    const targets = await ctx.targets.write(req.body)
    await ctx.dispatcher.stop()
    await ctx.dispatcher.reload()
    await ctx.dispatcher.start()
    res.json(targets)
    next()
  }
  catch (err) {
    next(err)
  }
}
