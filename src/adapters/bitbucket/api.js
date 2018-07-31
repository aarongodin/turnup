const request = require('request-promise-native')
const querystring = require('querystring')

class Api {
  constructor({ token, baseUrl }) {
    this.accessToken = token
    this.baseUrl = baseUrl
  }

  buildUrl(uri) {
    return `${this.baseUrl}${uri}`
  }

  getHeaders() {
    return {
      'Authorization': `Basic ${this.accessToken}`,
      'User-Agent': 'turnup NPM module'
    }
  }

  async getRepo(repoFullName) {
    const raw = await request.get(this.buildUrl(`/repositories/${repoFullName}`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async getRepos(user) {
    const raw = await request.get(this.buildUrl(`/repositories/${user}`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async getContents(repoFullName, ref, path) {
    const raw = await request.get(this.buildUrl(`/repositories/${repoFullName}/src/${ref}/${path}`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async getFileMeta(repoFullName, ref, path) {
    const raw = await request.get(this.buildUrl(`/repositories/${repoFullName}/src/${ref}/${path}?format=meta`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async getBranch(repoFullName, branchName) {
    const raw = await request.get(this.buildUrl(`/repositories/${repoFullName}/refs/branches/${branchName}`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async createBranch(repoFullName, ref, baseSha) {
    return await request.post(this.buildUrl(`/repositories/${repoFullName}/refs/branches`), {
      headers: this.getHeaders(),
      body: {
        name: ref,
        target: {
          hash: baseSha
        }
      },
      json: true
    })
  }

  async createContents(repoFullName, branch, path, sourceCommitId, contents, message) {
    const url = this.buildUrl(`/repositories/${repoFullName}/src`)
    const body = querystring.stringify({
      message,
      branch,
      [path]: contents
    })

    return await request.post(url, {
      headers: {
        ...this.getHeaders(),
        'Content-Length': body.length,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      qs: {
        sourceCommitId
      },
      body
    })
  }

  async createPull(repoFullName, dest, src, title, description) {
    return await request.post(this.buildUrl(`/repositories/${repoFullName}/pullrequests`), {
      headers: this.getHeaders(),
      body: {
        title,
        summary: {
          raw: description
        },
        destination: {
          branch: {
            name: dest
          }
        },
        source: {
          branch: {
            name: src
          }
        }
      },
      json: true
    })
  }
}

module.exports = Api
