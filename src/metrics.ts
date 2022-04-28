import * as client from 'prom-client'

export type Metrics = {
  register: client.Registry

  contentLength: client.Counter<string>
  download: client.Counter<string>
  requests: client.Counter<string>
  ttfb: client.Counter<string>
}

const Prefix = 'monitor_'

const createMetrics = (): Metrics => {
  const register = new client.Registry()

  const contentLength = new client.Counter({
    name: `${Prefix}content_length`,
    help: 'Content-Length of requests',
    labelNames: ['contentType', 'cache'],
    registers: [register]
  })

  const download = new client.Counter({
    name: `${Prefix}download`,
    help: 'Time to download resource',
    labelNames: ['contentType', 'cache'],
    registers: [register]
  })

  const requests = new client.Counter({
    name: `${Prefix}requests`,
    help: 'Number of requests',
    labelNames: ['contentType', 'cache'],
    registers: [register]
  })

  const ttfb = new client.Counter({
    name: `${Prefix}ttfb`,
    help: 'Time to first byte',
    labelNames: ['contentType', 'cache'],
    registers: [register]
  })

  return {
    contentLength,
    download,
    register,
    requests,
    ttfb
  }
}

export default createMetrics
