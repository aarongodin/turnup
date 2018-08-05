const Immutable = require('immutable')

module.exports = Immutable.Record({
  name: '',
  fullName: '',
  defaultBranch: '',
  latestCommit: '',
  packageDefinition: null,
  lockfileEntity: null,
  dependencyRelationship: {},
  projectName: ''
})
