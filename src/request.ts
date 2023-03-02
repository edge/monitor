// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import { Context } from './main'
import { Target } from './targets/types'
import http from 'http'
import https from 'https'
import createTimer, { Result } from './timer'

/**
 * Headers recognized by this app.
 * Some are used in metrics.
 */
export type Header = 'cache' | 'contentLength' | 'contentType'

/**
 * Response object containing a given target, response headers for the same, and a timings result for the
 * HTTP request connecting the two.
 */
export type Response = {
  headers: Record<Header, string>
  result: Result
  target: Target
}

/** Check whether a URL is HTTPS. */
const isSecureUrl = (url: string) => url.startsWith('https:')

/** Perform, and time, an HTTP GET request to a specified target. */
const request = ({ log }: Context, target: Target) => new Promise<Response>((resolve, reject) => {
  const proto = isSecureUrl(target.url) ? https : http
  const timer = createTimer()

  const req = proto.get(target.url)

  req.on('response', res => {
    res.once('readable', () => {
      timer.ttfb()
      log.trace('ttfb', target)
    })

    res.on('readable', () => {
      while (res.read() !== null);
    })

    res.on('end', () => {
      timer.download()
      const result = timer.complete()
      log.trace('download', { target, delta: result.delta })
      resolve({
        target,
        result,
        headers: {
          cache: typeof res.headers['x-cache'] === 'string' && res.headers['x-cache'] || '',
          contentLength: res.headers['content-length'] || '0',
          contentType: res.headers['content-type'] || ''
        }
      })
    })
  })

  req.on('socket', sock => {
    sock.on('lookup', () => {
      timer.dns()
      log.trace('dns', target)
    })
    sock.on('connect', () => {
      timer.tcp()
      log.trace('connect', target)
    })
    sock.on('secureConnect', () => {
      timer.ssl()
      log.trace('ssl', target)
    })
  })

  req.on('error', err => {
    reject(err)
  })

  timer.start()
  req.end()
})

export default request
