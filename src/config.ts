import dotenv from 'dotenv'

const Second = 1000

dotenv.config()

export default {
  /** Delay between requests in a cycle (milliseconds) */
  delay: parseInt(process.env.DELAY || '250'),
  /** Frequency of request cycle (or, delay between ticks) (seconds) */
  frequency: parseInt(process.env.FREQUENCY || '15') * Second,
  /** HTTP server configuration */
  http: {
    /** HTTP listen port */
    port: parseInt(process.env.HTTP_PORT || '8456'),
    /** HTTP bearer authorization token */
    token: process.env.HTTP_TOKEN
  },
  /** Logging configuration */
  log: {
    /** Log level (error, warn, info, or debug) */
    level: process.env.LOG_LEVEL || 'info'
  },
  /** Number of request cycles to effect. Set to 0 for continuous operation */
  stop: parseInt(process.env.STOP || '0'),
  /** Request targets configuration */
  targets: {
    /** Requests data (as YAML) */
    data: process.env.TARGETS_DATA || '',
    /** Path to requests data YAML file if requests data is not given explicitly */
    file: process.env.TARGETS_FILE || 'targets.yaml'
  }
}
