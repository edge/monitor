import { Context } from '../main'
import { Target } from './types'
import { readFile, stat, writeFile } from 'fs/promises'

export type TargetsModel = ReturnType<typeof model>

const HTTP_METHOD: (string | undefined)[] = ['DELETE', 'GET', 'HEAD', 'POST', 'PUT']
const LOCK = 'targets'

/**
 * Validate an input as a Target.
 * Returns a Target object if the input is valid, otherwise throws an error.
 */
const validate = (obj: unknown): Target => {
  if (typeof obj !== 'object') throw new Error('must be an object')
  if (obj instanceof Array) throw new Error('may not be an array')
  if (obj === null) throw new Error('may not be null')
  const tobj = obj as Record<string, unknown>

  let enabled: boolean | undefined
  if (typeof tobj.enabled === 'boolean') {
    enabled = tobj.enabled
  }
  else if (tobj.enabled !== undefined) {
    throw new Error('enabled must be Boolean')
  }

  if (typeof tobj.url !== 'string') throw new Error('url must be a string')
  // @todo validate url
  const url = tobj.url as string

  if (typeof tobj.method !== 'string') throw new Error('method must be a string')
  if (!HTTP_METHOD.includes(tobj.method)) throw new Error(`method must be one of ${HTTP_METHOD.join(', ')}`)
  const method = tobj.method

  let headers: Target['headers']
  if (typeof tobj.headers === 'object') {
    if (tobj.headers instanceof Array) throw new Error('headers may not be an array')
    if (tobj.headers === null) throw new Error('headers may not be null')
    const theaders = tobj.headers as Record<string, unknown>
    headers = {}
    for (const header in theaders) {
      const value = theaders[header]
      if (typeof value !== 'string') throw new Error(`header "${header}" must be a string`)
      headers[header] = value
    }
  }
  else if (tobj.headers !== undefined) {
    throw new Error('headers must be an object')
  }

  let frequency: number | undefined
  if (typeof tobj.frequency === 'number') {
    if (tobj.frequency < 0) throw new Error('frequency must be at least 0')
    if (tobj.frequency > 0) frequency = tobj.frequency
  }
  else if (tobj.frequency !== undefined) {
    throw new Error('frequency must be a number')
  }

  let timeout: number | undefined
  if (typeof tobj.timeout === 'number') {
    if (tobj.timeout < 0) throw new Error('timeout must be at least 0')
    if (tobj.timeout > 0) timeout = tobj.timeout
  }
  else if (tobj.timeout !== undefined) {
    throw new Error('timeout must be a number')
  }

  return { enabled, frequency, headers, method, timeout, url }
}

/**
 * Targets database model.
 */
const model = ({ config, lock, log }: Context) => {
  const data: Target[] = []
  let initialised = false
  const path = config.targets.path

  const read = () => lock.acquire(LOCK, async () => {
    initialised = true
    try {
      const info = await stat(path)
      if (!info.isFile) {
        throw new Error(`targets file "${path}" is not a file`)
      }
    }
    catch (err) {
      if (/^ENOENT/.test((err as Error).message)) {
        log.warn('targets file not found', { path })
        return []
      }
      throw err
    }
    const text = (await readFile(path)).toString()
    const result = JSON.parse(text)
    const valid: Target[] = []
    if (result instanceof Array) {
      for (const data of result) {
        try {
          const target = validate(data)
          valid.push(target)
        }
        catch (err) {
          log.error('skipped invalid target', { data, err })
        }
      }

      while (data.length > 0) data.pop()
      for (const target of valid) data.push(target)

      log.info('read targets from file', { path })
      return data
    }
    throw new Error('target')
  })

  const write = (targets: Target[]) => lock.acquire(LOCK, async () => {
    for (const i in targets) {
      targets[i] = validate(targets[i])
    }
    const text = JSON.stringify(targets)
    await writeFile(path, text)

    while (data.length > 0) data.pop()
    for (const target of targets) data.push(target)

    log.info('wrote targets to file', { path })
    return data
  })

  const get = () => lock.acquire(LOCK, () => {
    if (!initialised) return read()
    return data
  })

  return { get, read, write, validate }
}

export default model
