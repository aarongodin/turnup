const inquirer = require('inquirer')
const { URL } = require('url')
const { fatal } = require('../errors')

const parseUrl = async (baseUrl, action) => {
  const parsedUrl = new URL(baseUrl)

  if (parsedUrl.protocol !== 'https:') {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'You are choosing to use an insecure protocol. Are you sure you want to continue?'
      }
    ])

    if (!answers.continue) {
      fatal(action, 'Use the configure command to reconfigure your adapter.')
    }
  }

  return parsedUrl
}

module.exports = {
  parseUrl
}
