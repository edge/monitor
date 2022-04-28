import { Log } from '@edge/log'
import { Target } from './targets'
import http from 'http'
import https from 'https'
import createTimer, { Result } from './timer'

const isSecureUrl = (url: string) => url.startsWith('https:')

export type Header = 'cache' | 'contentLength' | 'contentType'

export type Response = {
  target: Target
  result: Result
  headers: Record<Header, string>
}

const request = (log?: Log) => (target: Target) => new Promise<Response>((resolve, reject) => {
  log?.debug('sending request', target)
  const proto = isSecureUrl(target.url) ? https : http
  const timer = createTimer()

  const req = proto.get(target.url)

  req.on('response', res => {
    res.on('readable', () => {
      timer.ttfb()
      log?.debug('readable', target)
      while (res.read() !== null);
    })

    res.on('end', () => {
      timer.download()
      log?.debug('end', target)
      resolve({
        target,
        result: timer.complete(),
        headers: {
          cache: typeof res.headers['x-cache'] === 'string' && res.headers['x-cache'] || '',
          contentLength: res.headers['content-length'] || '',
          contentType: res.headers['content-type'] || ''
        }
      })
    })
  })

  req.on('error', err => {
    log?.error('error', { ...target, err })
    reject(err)
  })

  timer.start()
  req.end()
})

export default request
