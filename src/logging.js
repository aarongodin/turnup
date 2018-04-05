const c = require('colors/safe')

const notify = (action, message) => {
  console.log(`[${c.bold(action)}] ${c.blue(message)}`)
}

module.exports = {
  notify
}
