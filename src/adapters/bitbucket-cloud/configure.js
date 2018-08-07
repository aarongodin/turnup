const inquirer = require('inquirer')
const _set = require('lodash.set')
const { notify } = require('../../logging')
const { fatal, errorTypes } = require('../../errors')
const globalConfig = require('../../config/global')
const { parseUrl } = require('../../packages/parse-url')

const ACTION = 'turnup.adapter.configure'
const DEFAULT_BASE_URL = 'https://www.bitbucket.org'

const configure = async () => {
  notify(ACTION, 'Configuring Bitbucket.')

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'consumerKey',
      message: 'Enter OAuth2 Consumer key:'
    },
    {
      type: 'password',
      name: 'consumerSecret',
      message: 'Enter OAuth2 Consumer secret:'
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: `Enter the Bitbucket API URL or press enter for default (${DEFAULT_BASE_URL}):`
    }
  ])

  const { baseUrl, consumerKey, consumerSecret } = answers

  const parsedUrl = parseUrl(baseUrl, ACTION)
  // API v1 is deprecated in Bitbucket Cloud. No need to make it configurable.
  parsedUrl.pathname = '/2.0'

  // Ensure we are hitting the API endpoint without requiring user to give us the exact host.
  if (!parsedUrl.host.match(/^api\..*$/)) {
    // prepend api. or replace www with api
    parsedUrl.host = parsedUrl.host.replace(/^(www\.)?/, 'api.')
  }

  const apiUrl = parsedUrl.toString()

  void [consumerKey, consumerSecret].forEach(k => {
    if (typeof k !== 'string' || k.length === 0) {
      fatal(ACTION, new errorTypes.ValidTokenNotProvidedError())
    }
  })

  const url = !baseUrl.length ? DEFAULT_BASE_URL : baseUrl

  const c = await globalConfig.load()
  _set(c, 'adapters.credentials.bitbucketCloud.consumerKey', consumerKey)
  _set(c, 'adapters.credentials.bitbucketCloud.consumerSecret', consumerSecret)
  _set(c, 'adapters.credentials.bitbucketCloud.apiUrl', apiUrl)
  _set(c, 'adapters.credentials.bitbucketCloud.baseUrl', url)
  await globalConfig.save(c)

  notify(ACTION, 'The Bitbucket adapter was configured.')
}

module.exports = configure
