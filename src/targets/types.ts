/**
 * Request target.
 */
export type Target = {
  enabled?: boolean
  frequency?: number
  headers?: Record<string, string>
  method: string
  timeout?: number
  url: string
}
