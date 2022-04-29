// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import config from './config'
import { parse } from 'yaml'
import { readFile } from 'fs/promises'

/**
 * Target resource.
 */
export type Target = {
  name?: string
  url: string
}

/**
 * Get target resources from configuration.
 * If `TARGET_DATA` is given it will be read directly as YAML.
 * Otherwise, the `TARGET_FILE` is read.
 * An error is thrown if there is no `TARGET_DATA` and the `TARGET_FILE` is not found.
 */
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
