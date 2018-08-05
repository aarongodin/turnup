const Bitbucket = require('./adapter')
const globalConfig = require('../../config/global')
const _get = require('lodash.get')

class Factory {
  async getConfig() {
    const c = await globalConfig.load()
    return _get(c, 'adapters.credentials.bitbucketCloud')
  }

  async ensure() {
    const config = await this.getConfig()
    return config !== undefined && config.consumerKey && config.baseUrl && config.consumerSecret
  }

  async createFromCli() {
    const config = await this.getConfig()
    return new Bitbucket(config)
  }
}

module.exports = Factory
