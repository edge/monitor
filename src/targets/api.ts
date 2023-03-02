import { Context } from '../main'
import { RequestHandler } from 'express'

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
