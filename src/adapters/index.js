const GitHub = require('./github')

const adapters = new Map([
  ['github', GitHub]
])

const getAdapter = adapterString => {
  return adapters.get(adapterString).Adapter
}

const getFactory = adapterString => {
  return adapters.get(adapterString).Factory
}

const getConfigure = adapterString => {
  return adapters.get(adapterString).configure
}

module.exports = {
  getAdapter,
  getFactory,
  getConfigure,
  types: Array.from(adapters.keys())
}
