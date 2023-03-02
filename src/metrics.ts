// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import * as client from 'prom-client'
import { Event } from './timer'
import { Response } from './request'

/** Group of metrics representing collective facets of any number of timed HTTP requests. */
export type MetricGroup = Omit<Record<Event, client.Counter<string>>, 'start'> & {
  contentLength: client.Counter<string>
  requests: client.Counter<string>
}

/**
 * Metrics 'context' object reflecting metrics recorded in this app.
 * Simplifies access to the registry and various counters.
 */
export type Metrics = {
  record: (res: Response) => void
  register: client.Registry
  resource: MetricGroup
  type: MetricGroup
}

/** Global prefix for all metrics to disambiguate monitor data from that of other apps. */
const Prefix = 'monitor_'

/** Create a metrics context. */
const metrics = (): Metrics => {
  const register = new client.Registry()

  const resource = createGroup(register, `${Prefix}resource_`, ['resource', 'cache'])
  const typ = createGroup(register, `${Prefix}type_`, ['type', 'cache'])

  const record = ({ headers, result, target }: Response) => {
    const resourceLabels = [target.url, headers.cache]
    resource.contentLength.labels(...resourceLabels).inc(parseInt(headers.contentLength))
    resource.dns.labels(...resourceLabels).inc(result.delta.dns)
    resource.download.labels(...resourceLabels).inc(result.delta.download)
    resource.requests.labels(...resourceLabels).inc()
    resource.ssl.labels(...resourceLabels).inc(Math.max(result.delta.ssl, 0))
    resource.tcp.labels(...resourceLabels).inc(result.delta.tcp)
    resource.ttfb.labels(...resourceLabels).inc(result.delta.ttfb)

    const typeLabels = [headers.contentType.startsWith('image/') ? 'image' : 'other', headers.cache]
    typ.contentLength.labels(...typeLabels).inc(parseInt(headers.contentLength))
    typ.dns.labels(...typeLabels).inc(result.delta.dns)
    typ.download.labels(...typeLabels).inc(result.delta.download)
    typ.requests.labels(...typeLabels).inc()
    typ.ssl.labels(...typeLabels).inc(Math.max(result.delta.ssl, 0))
    typ.tcp.labels(...typeLabels).inc(result.delta.tcp)
    typ.ttfb.labels(...typeLabels).inc(result.delta.ttfb)
  }

  return {
    record,
    register,
    resource,
    type: typ
  }
}

/** Create a group of metrics, attaching each metric to a registry. */
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

export default metrics
