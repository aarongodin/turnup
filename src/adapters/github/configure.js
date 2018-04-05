const inquirer = require('inquirer')
const _set = require('lodash.set')
const { notify } = require('../../logging')
const { fatal, errorTypes } = require('../../errors')
const globalConfig = require('../../config/global')

const ACTION = 'turnup.adapter.configure'

const configure = async () => {
  notify(ACTION, 'Configuring GitHub.')

  const answers = await inquirer.prompt([{
    type: 'input',
    name: 'token',
    message: 'Enter a personal access token created from your GitHub account:'
  }])

  const { token } = answers

  if (typeof token !== 'string' || token.length === 0) {
    fatal(ACTION, new errorTypes.ValidTokenNotProvidedError())
  }

  const c = await globalConfig.load()
  _set(c, 'adapters.credentials.github.token', token)
  await globalConfig.save(c)

  notify(ACTION, 'The GitHub adapter was configured.')
}

module.exports = configure
