const Immutable = require('immutable')

module.exports = Immutable.Record({
  name: '',
  fullName: '',
  defaultBranch: '',
  packageDefinition: null,
  lockfileEntity: null,
  dependencyRelationship: {}
})
