const Index = require('../index')

describe('index', () => {
  it('has exports', () => {
    expect(Index.Adapter).toBeDefined()
    expect(Index.Factory).toBeDefined()
    expect(Index.configure).toBeDefined()
  })
})
