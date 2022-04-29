// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import { Log } from '@edge/log'
import { Metrics } from './metrics'
import config from './config'
import http from 'http'

/**
 * Start listening for HTTP requests.
 *
 * Returns a tuple of a cancel function and a Promise that rejects if the server encounters an error.
 * The Promise will not resolve.
 */
const listen = (metrics: Metrics, log?: Log): [() => void, Promise<void>] => {
  const server = http.createServer()
  const cancel = () => {
    server.close(() => {
      log?.info('stopped')
    })
  }

  server.on('request', receive(metrics))

  return [cancel, new Promise((_, reject) => {
    server.on('error', err => {
      log?.error(err)
      reject(err)
    })

    server.listen(config.http.port, () => {
      log?.info('listening', config.http)
    })
  })]
}

/** Print metrics to (and end) HTTP response. */
const printMetrics = async (metrics: Metrics, res: http.ServerResponse) => {
  res.writeHead(200)
  res.end(await metrics.register.metrics())
}

/** Receive and respond to an HTTP request. */
const receive = (metrics: Metrics): http.RequestListener => (req, res) => {
  if (config.http.token) {
    const auth = req.headers.authorization
    const token = auth && (auth.startsWith('Bearer ') || auth.startsWith('bearer ')) && auth.slice(7)
    if (token !== config.http.token) return json(res, 403, { error: 'forbidden' })
  }

  if (req.url === '/') return printMetrics(metrics, res)

  json(res, 404, { error: 'page not found' })
}

/** Write JSON to (and end) HTTP response. */
const json = (res: http.ServerResponse, code: number, data?: Record<string, unknown>) => {
  res.writeHead(code, data && { 'Content-Type': 'application/json' })
  res.end(data && JSON.stringify(data))
}

export default listen
