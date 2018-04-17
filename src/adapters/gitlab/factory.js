const GitLab = require('./adapter')
const globalConfig = require('../../config/global')
const _get = require('lodash.get')

class Factory {
  async getToken() {
    const c = await globalConfig.load()
    return _get(c, 'adapters.credentials.gitlab.token')
  }

  async ensure() {
    const token = await this.getToken()
    return token !== undefined
  }

  async createFromCli() {
    const token = await this.getToken()
    return new GitLab(token)
  }
}

module.exports = Factory
