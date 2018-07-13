const inquirer = require('inquirer')
const { URL } = require('url')
const _set = require('lodash.set')
const { notify } = require('../../logging')
const { fatal, errorTypes } = require('../../errors')
const globalConfig = require('../../config/global')

const ACTION = 'turnup.adapter.configure'
const DEFAULT_BASE_URL = 'https://api.bitbucket.org/2.0'

const configure = async () => {
  notify(ACTION, 'Configuring BitBucket.')

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'token',
      message: 'Enter a personal access token created from your BitBucket account:'
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: `Enter the BitBucket API URL or press enter for default (${DEFAULT_BASE_URL}):`
    }
  ])

  const { baseUrl, token } = answers

  if (typeof token !== 'string' || token.length === 0) {
    fatal(ACTION, new errorTypes.ValidTokenNotProvidedError())
  }

  const url = !baseUrl.length ? DEFAULT_BASE_URL : baseUrl
  const parsedUrl = new URL(url)

  // Ensure the URL path is valid bit bucket API, hard code to 2.0 when not there.
  if (!parsedUrl.pathname.match(/\/\d\.\d$/)) {
    parsedUrl.path = '/2.0'
  }

  // Ensure we are hitting the API endpoint without requiring user to give us the exact host.
  if (!parsedUrl.host.match(/^api\..*$/)) {
    // prepend api. or replace www with api
    parsedUrl.host = parsedUrl.host.replace(/^(www\.)?/, 'api.')
  }

  const c = await globalConfig.load()
  _set(c, 'adapters.credentials.bitbucket.token', token)
  _set(c, 'adapters.credentials.bitbucket.baseUrl', parsedUrl.toString())
  await globalConfig.save(c)

  notify(ACTION, 'The BitBucket adapter was configured.')
}

module.exports = configure
