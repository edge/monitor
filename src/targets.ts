import { parse } from 'yaml'
import { readFile } from 'fs/promises'

export type Target = {
  url: string
}

const targetsData = process.env.TARGETS_DATA || ''
const targetsFile = process.env.TARGETS_FILE || 'targets.yaml'

export default async (): Promise<Target[]> => {
  const targets: Target[] = []
  let result: unknown = undefined
  if (targetsData) result = parse(targetsData, {})
  else {
    const data = await readFile(targetsFile)
    result = parse(data.toString())
  }
  if (!(result instanceof Array)) throw new Error('invalid targets data')
  result.forEach((t, i) => {
    if (!t.url) throw new Error(`invalid URL for target ${i}`)
    targets.push(t)
  })
  return targets
}
