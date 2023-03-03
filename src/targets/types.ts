/**
 * Request target.
 */
export type Target = {
  enabled: boolean
  frequency: number
  hash: string
  headers?: Record<string, string>
  method: string
  timeout: number
  url: string
}
