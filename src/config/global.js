const fs = require('fs')
const { promisify } = require('util')

const defaultConfig = {
  adapters: {
    credentials: {}
  }
}

const filepath = `${process.env.HOME}/.turnup.json`

const load = async () => {
  try {
    const c = await promisify(fs.readFile)(filepath)
    return JSON.parse(c)
  } catch (err) {
    return defaultConfig
  }
}

const save = async (c) => {
  return await promisify(fs.writeFile)(filepath, JSON.stringify(c))
}

module.exports = {
  load,
  save
}
