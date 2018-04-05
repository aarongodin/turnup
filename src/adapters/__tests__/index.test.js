const adapters = require('../index')

describe('adapters', () => {
  it('gets an adapter', () => {
    expect(adapters.getAdapter('github')).toBeDefined()
  })

  it('gets a factory', () => {
    expect(adapters.getFactory('github')).toBeDefined()
  })

  it('gets a configure function', () => {
    expect(adapters.getConfigure('github')).toBeDefined()
  })

  it('has types', () => {
    expect(Array.isArray(adapters.types)).toBe(true)
  })
})
