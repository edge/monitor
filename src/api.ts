import { Log } from '@edge/log'
import config from './config'
import http from 'http'

const listen = async (log?: Log) => new Promise((_, reject) => {
  const server = http.createServer()
  server.on('request', receive)

  server.on('error', err => {
    log?.error(err)
    reject(err)
  })

  server.listen(config.http.port, () => {
    log?.info('listening', config.http)
  })
})

const metrics: http.RequestListener = (req, res) => {
  send(res, 200, { message: 'metrics!' })
}

const receive: http.RequestListener = (req, res) => {
  if (config.http.token) {
    const auth = req.headers.authorization
    const token = auth && (auth.startsWith('Bearer ') || auth.startsWith('bearer ')) && auth.slice(7)
    if (token !== config.http.token) return send(res, 403, { error: 'forbidden' })
  }

  if (req.url === '/') return metrics(req, res)

  send(res, 404, { error: 'page not found' })
}

const send = (res: http.ServerResponse, code: number, data?: Record<string, unknown>) => {
  res.writeHead(code, data && { 'Content-Type': 'application/json' })
  res.end(data && JSON.stringify(data))
}

export default listen
