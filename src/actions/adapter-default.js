const _set = require('lodash.set')
const { notify } = require('../logging')
const globalConfig = require('../config/global')

const ACTION = 'turnup.adapter.default'

module.exports = async (adapter) => {
  const c = await globalConfig.load()
  _set(c, 'adapters.default', adapter.getKey())
  await globalConfig.save(c)
  notify(ACTION, `Default global adapter is now ${adapter.getName()}.`)
}
