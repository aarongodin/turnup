const GitHub = require('./adapter')
const globalConfig = require('../../config/global')
const _get = require('lodash.get')

class Factory {
  async getToken() {
    const c = await globalConfig.load()
    return _get(c, 'adapters.credentials.github.token')
  }

  async ensure() {
    const token = await this.getToken()
    return token !== undefined
  }

  async createFromCli() {
    const token = await this.getToken()
    return new GitHub(token)
  }
}

module.exports = Factory
