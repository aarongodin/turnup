const chalk = require('chalk')

const notify = (action, message) => {
  console.log(`[${chalk.bold(action)}] ${chalk.blue(message)}`)
}

module.exports = {
  notify
}
