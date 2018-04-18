const configGlobal = require('../global')

describe('Global config', () => {
  it('should pass', () => {
    expect(configGlobal.load).toBeDefined()
    expect(configGlobal.save).toBeDefined()
  })
})

