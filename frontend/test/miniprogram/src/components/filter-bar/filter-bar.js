Component({
  properties: {
    keyword: { type: String, value: '' },
  },
  methods: {
    onInput(e) {
      this.triggerEvent('change', { keyword: e.detail.value })
    },
    onClear() {
      this.triggerEvent('change', { keyword: '' })
    },
  },
})
