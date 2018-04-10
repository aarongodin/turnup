const chalk = require('chalk')

const notify = (action, message, exit = false) => {
  console.log(`[${chalk.bold(action)}] ${chalk.blue(message)}`)
  if (exit) { process.exit(0) }
}

module.exports = {
  notify
}
