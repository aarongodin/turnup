const inquirer = require('inquirer')
const _set = require('lodash.set')
const { notify } = require('../../logging')
const { fatal, errorTypes } = require('../../errors')
const globalConfig = require('../../config/global')

const ACTION = 'turnup.adapter.configure'

const configure = async () => {
  notify(ACTION, 'Configuring GitLab.')

  const answers = await inquirer.prompt([{
    type: 'input',
    name: 'token',
    message: 'Enter a personal access token created from your GitLab account:'
  }])

  const { token } = answers

  if (typeof token !== 'string' || token.length === 0) {
    fatal(ACTION, new errorTypes.ValidTokenNotProvidedError())
  }

  const c = await globalConfig.load()
  _set(c, 'adapters.credentials.gitlab.token', token)
  await globalConfig.save(c)

  notify(ACTION, 'The GitLab adapter was configured.')
}

module.exports = configure
