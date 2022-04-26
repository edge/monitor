export default {
  targets: {
    data: process.env.TARGETS_DATA || '',
    file: process.env.TARGETS_FILE || 'targets.yaml'
  }
}
