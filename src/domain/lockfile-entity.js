const Immutable = require('immutable')

module.exports = Immutable.Record({
  fileContents: '',
  fileName: '',
  sha: '',
  packageManager: ''
})
