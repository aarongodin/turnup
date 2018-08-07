const inquirer = require('inquirer')
const _set = require('lodash.set')
const { notify } = require('../../logging')
const { fatal, errorTypes } = require('../../errors')
const globalConfig = require('../../config/global')
const { parseUrl } = require('../../packages/parse-url')

const ACTION = 'turnup.adapter.configure'

const configure = async () => {
  notify(ACTION, 'Configuring Bitbucket Server.')

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'authType',
      message: 'Enter the type of authentication you would like to use:',
      choices: [
        {
          name: 'Basic Authentication',
          value: 'Basic'
        },
        {
          name: 'Personal Token Authentication',
          value: 'Bearer'
        }
      ]
    },
    {
      type: 'password',
      name: 'token',
      message: 'Enter a personal access token created from your Bitbucket Server account:'
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: `Enter the Bitbucket Server API URL:`
    }
  ])

  const { authType, baseUrl, token } = answers

  if (typeof token !== 'string' || token.length === 0) {
    fatal(ACTION, new errorTypes.ValidTokenNotProvidedError())
  }

  const parsedUrl = await parseUrl(baseUrl, ACTION)

  // Ensure the URL path is valid bit bucket API, hard code to 2.0 when not there.
  if (!parsedUrl.pathname) {
    parsedUrl.pathname = '/rest/api/1.0'
  }

  const c = await globalConfig.load()
  _set(c, 'adapters.credentials.bitbucketServer.authType', authType)
  _set(c, 'adapters.credentials.bitbucketServer.token', token)
  _set(c, 'adapters.credentials.bitbucketServer.baseUrl', parsedUrl.toString())
  await globalConfig.save(c)

  notify(ACTION, 'The Bitbucket Server adapter was configured.')
}

module.exports = configure
