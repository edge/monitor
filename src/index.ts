import dotenv from 'dotenv'
import main from './main'

dotenv.config()

const TRUE: (string | undefined)[] = ['1', 'true', 'yes']

main({
  http: {
    port: parseInt(process.env.HTTP_PORT || '8456')
  },
  log: {
    level: process.env.LOG_LEVEL || 'warn'
  },
  public: {
    path: process.env.PUBLIC_PATH || 'public'
  },
  request: {
    frequency: parseInt(process.env.REQUEST_FREQUENCY || '60'),
    timeout: parseInt(process.env.REQUEST_TIMEOUT || '30')
  },
  targets: {
    path: process.env.TARGETS_PATH || 'targets.json'
  },
  ui: {
    enabled: TRUE.includes(process.env.UI_ENABLED)
  }
})
