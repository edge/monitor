import config from './config'
import { parse } from 'yaml'
import { readFile } from 'fs/promises'

export type Target = {
  url: string
}

const getTargets = async (): Promise<Target[]> => {
  const targets: Target[] = []
  let result: unknown = undefined
  if (config.targets.data) result = parse(config.targets.data, {})
  else {
    const data = await readFile(config.targets.file)
    result = parse(data.toString())
  }
  if (!(result instanceof Array)) throw new Error('invalid targets data')
  result.forEach((t, i) => {
    if (!t.url) throw new Error(`invalid URL for target ${i}`)
    targets.push(t)
  })
  return targets
}

export default getTargets
