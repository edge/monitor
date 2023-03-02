import * as targets from './targets/api'
import { Context } from './main'
import cors from 'cors'
import express, { ErrorRequestHandler, RequestHandler, json } from 'express'

/**
 * Final error handler.
 * Logs any unhandled error and ensures the response is a safe 500 Internal Server Error, if not already sent.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const finalError = (ctx: Context): ErrorRequestHandler => (err, req, res, next) => {
  ctx.log.error(`${req.method} ${req.url}`, { err })
  if (res.headersSent) return
  res.status(500).json({ error: 'internal server error' })
}

/** Final handler for requests not matched. */
const finalNotFound: RequestHandler = (req, res, next) => {
  if (!res.headersSent) {
    res.status(404).json({ error: 'no route' })
  }
  next()
}

const metrics = (ctx: Context): RequestHandler => async (req, res, next) => {
  const text = await ctx.metrics.register.metrics()
  res.send(text)
  next()
}

const api = (ctx: Context) => {
  const app = express()
  app.use(json())
  app.use(cors())

  app.get('/api/metrics', metrics(ctx))

  app.get('/api/targets', targets.getTargets(ctx))
  app.put('/api/targets', targets.setTargets(ctx))

  app.use(finalError(ctx))
  app.use(express.static(ctx.config.public.path))
  app.use(finalNotFound)

  return app.listen(ctx.config.http.port)
}

export default api
