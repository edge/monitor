/* global Vue */
/* global setInterval */
/* global setTimeout */
/* global superagent */

//
// Component library
//

/* eslint-disable max-len */

const ArrowDownIcon = {
  template: `
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" :fill="color" class="w-5 h-5">
        <path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clip-rule="evenodd" />
      </svg>
    </div>
  `,
  props: {
    color: {
      type: String,
      required: false,
      default: '#1d1d1d'
    }
  }
}

const ArrowUpIcon = {
  template: `
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" :fill="color" class="w-5 h-5">
        <path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clip-rule="evenodd" />
      </svg>
    </div>
  `,
  props: {
    color: {
      type: String,
      required: false,
      default: '#1d1d1d'
    }
  }
}

const DuplicateIcon = {
  template: `
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
        <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
        <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
      </svg>
    </div>
  `,
  props: {
    color: {
      type: String,
      required: false,
      default: '#1d1d1d'
    }
  }
}

const TrashIcon = {
  template: `
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" :fill="color" class="w-5 h-5">
        <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd" />
      </svg>
    </div>
  `,
  props: {
    color: {
      type: String,
      required: false,
      default: '#1d1d1d'
    }
  }
}

/* eslint-enable max-len */

//
// Create app
//

const app = Vue.createApp({
  data() {
    return {
      config: {},
      status: {},
      targets: []
    }
  },
  components: {
    'icon-arrow-down': ArrowDownIcon,
    'icon-arrow-up': ArrowUpIcon,
    'icon-duplicate': DuplicateIcon,
    'icon-trash': TrashIcon
  },
  methods: {
    append() {
      const targets = this.targets.map(t => t)
      targets.push({
        enabled: true,
        frequency: this.config.request.frequency,
        method: 'GET',
        timeout: this.config.request.timeout
      })
      this.targets = targets
    },
    duplicate(i) {
      const targets = this.targets.slice(0, i+1)
      const src = this.targets[i]
      targets.push({
        enabled: src.enabled,
        frequency: src.frequency,
        method: src.method,
        timeout: src.timeout,
        url: src.url
      })
      targets.push(...this.targets.slice(i+1))
      this.targets = targets
    },
    getError(target) {
      if (this.hasError(target)) return this.status[target.hash].error
      return ''
    },
    getLastRequestAge(target) {
      if (this.hasStatus(target)) {
        const diff = Date.now() - this.status[target.hash].start
        const secs = Math.round(diff/1000)
        return `${secs}s ago`
      }
      return ''
    },
    getLastRequestDuration(target) {
      if (this.hasStatus(target)) {
        return `${this.status[target.hash].total.download}ms`
      }
      return ''
    },
    getLastRequestTime(target) {
      if (this.hasStatus(target)) {
        const d = new Date(this.status[target.hash].start)
        return d.toISOString()
      }
    },
    hasError(target) {
      if (this.status[target.hash] === undefined) return false
      return this.status[target.hash].error !== undefined
    },
    hasStatus(target) {
      if (this.hasError(target)) return false
      return this.status[target.hash] !== undefined
    },
    move(i, dest) {
      if (dest < 0 || dest > this.targets.length) return
      if (i < dest) {
        const targets = this.targets.slice(0, i)
        targets.push(...this.targets.slice(i+1, dest+1))
        targets.push(this.targets[i])
        targets.push(...this.targets.slice(dest+1))
        this.targets = targets
      }
      else if (i > dest) {
        const targets = this.targets.slice(0, dest)
        targets.push(this.targets[i])
        targets.push(...this.targets.slice(dest, i))
        targets.push(...this.targets.slice(i+1))
        this.targets = targets
      }
    },
    async redraw() {
      this.$forceUpdate()
      let mustRefresh = false
      for (const target of this.targets) {
        if (target.enabled === false) continue
        if (!this.hasStatus(target)) continue
        const diff = Math.round((Date.now() - this.status[target.hash].start)/1000)
        if (diff > target.frequency) {
          mustRefresh = true
          break
        }
      }
      if (mustRefresh) {
        return await this.refreshStatus()
      }
    },
    async refresh() {
      const res = await superagent.get('/api/targets')
      this.targets = res.body
    },
    async refreshConfig() {
      const res = await superagent.get('/api/config')
      this.config = res.body
    },
    async refreshStatus() {
      const res = await superagent.get('/api/targets/status')
      this.status = res.body
    },
    remove(i) {
      const targets = [
        ...this.targets.slice(0, i),
        ...this.targets.slice(i+1)
      ]
      this.targets = targets
    },
    async send() {
      const res = await superagent.put('/api/targets').send(this.targets)
      this.targets = res.body
      setTimeout(() => this.refreshStatus(), 500)
    },
    setEnabled(i, e) {
      this.targets[i].enabled = e.target.checked
    },
    setFrequency(i, e) {
      this.targets[i].frequency = parseInt(e.target.value) || 0
    },
    setMethod(i, e) {
      this.targets[i].method = e.target.value
    },
    setTimeout(i, e) {
      this.targets[i].timeout = parseInt(e.target.value) || 0
    },
    setURL(i, e) {
      this.targets[i].url = e.target.value
    }
  },
  async mounted() {
    await this.refreshConfig()
    await this.refresh()
    await this.refreshStatus()
    // setInterval(() => this.redraw(), 1000)
  }
})

//
// Start app
//

app.mount('#targets')
