import { Log } from '@edge/log'
import { Metrics } from './metrics'
import config from './config'
import http from 'http'

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

const printMetrics = async (metrics: Metrics, res: http.ServerResponse) => {
  res.writeHead(200)
  res.end(await metrics.register.metrics())
}

const receive = (metrics: Metrics): http.RequestListener => (req, res) => {
  if (config.http.token) {
    const auth = req.headers.authorization
    const token = auth && (auth.startsWith('Bearer ') || auth.startsWith('bearer ')) && auth.slice(7)
    if (token !== config.http.token) return json(res, 403, { error: 'forbidden' })
  }

  if (req.url === '/') return printMetrics(metrics, res)

  json(res, 404, { error: 'page not found' })
}

const json = (res: http.ServerResponse, code: number, data?: Record<string, unknown>) => {
  res.writeHead(code, data && { 'Content-Type': 'application/json' })
  res.end(data && JSON.stringify(data))
}

export default listen
