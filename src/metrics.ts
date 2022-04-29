import * as client from 'prom-client'
import { Event } from './timer'

export type MetricGroup = Omit<Record<Event, client.Counter<string>>, 'start'> & {
  contentLength: client.Counter<string>
  requests: client.Counter<string>
}

export type Metrics = {
  register: client.Registry
  resource: MetricGroup
  type: MetricGroup
}

const Prefix = 'monitor_'

const createMetrics = (): Metrics => {
  const register = new client.Registry()

  const resource = createGroup(register, `${Prefix}resource_`, ['resource', 'cache'])
  const typ = createGroup(register, `${Prefix}type_`, ['type', 'cache'])

  return {
    register,
    resource,
    type: typ
  }
}

const createGroup = (register: client.Registry, pf: string, labelNames: string[]): MetricGroup => {
  const rest = { labelNames, registers: [register] }

  const contentLength = new client.Counter({ name: `${pf}content_length`, help: 'Content-Length of requests', ...rest })
  const dns = new client.Counter({ name: `${pf}dns`, help: 'Time to resolve DNS', ...rest })
  const download = new client.Counter({ name: `${pf}download`, help: 'Download time', ...rest })
  const requests = new client.Counter({ name: `${pf}requests`, help: 'Number of requests', ...rest })
  const ssl = new client.Counter({ name: `${pf}ssl`, help: 'Time to establish SSL connection', ...rest })
  const tcp = new client.Counter({ name: `${pf}tcp`, help: 'Time to establish TCP connection', ...rest })
  const ttfb = new client.Counter({ name: `${pf}ttfb`, help: 'Time to first byte', ...rest })

  return { contentLength, dns, download, requests, ssl, tcp, ttfb }
}

export default createMetrics
