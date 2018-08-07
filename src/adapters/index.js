const GitHub = require('./github')
const GitLab = require('./gitlab')
const BitbucketCloud =  require('./bitbucket-cloud')
const BitbucketServer =  require('./bitbucket-server')

const adapters = new Map([
  ['github', GitHub],
  ['gitlab', GitLab],
  ['bitbucket-cloud', BitbucketCloud],
  ['bitbucket-server', BitbucketServer]
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
