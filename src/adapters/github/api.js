const request = require('request-promise-native')

class Api {
  constructor(accessToken) {
    this.accessToken = accessToken
  }

  buildUrl(uri) {
    return `https://api.github.com${uri}`
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'User-Agent': 'turnup NPM module'
    }
  }

  async getRepo(repoFullName) {
    const raw = await request.get(this.buildUrl(`/repos/${repoFullName}`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async getContents(repoFullName, path) {
    const raw = await request.get(this.buildUrl(`/repos/${repoFullName}/contents/${path}`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async getRef(repoFullName, base) {
    const raw = await request.get(this.buildUrl(`/repos/${repoFullName}/git/refs/heads/${base}`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async createRef(repoFullName, ref, baseSha) {
    return await request.post(this.buildUrl(`/repos/${repoFullName}/git/refs`), {
      headers: this.getHeaders(),
      body: {
        ref: `refs/heads/${ref}`,
        sha: baseSha
      },
      json: true
    })
  }

  async createContents(repoFullName, branchName, path, currentSha, contents, message) {
    const url = this.buildUrl(`/repos/${repoFullName}/contents/${path}`)
    const content = Buffer.from(contents).toString('base64')

    return await request.put(url, {
      headers: this.getHeaders(),
      body: {
        message,
        content,
        sha: currentSha,
        branch: branchName
      },
      json: true
    })
  }

  async createPull(repoFullName, base, head, title, body) {
    return await request.post(this.buildUrl(`/repos/${repoFullName}/pulls`), {
      headers: this.getHeaders(),
      body: {
        title,
        body,
        base,
        head
      },
      json: true
    })
  }
}

module.exports = Api
