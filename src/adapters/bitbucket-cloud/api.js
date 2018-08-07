const request = require('request-promise-native')
const querystring = require('querystring')
const OAuth = require('oauth')

class Api {
  constructor({ consumerKey, consumerSecret, baseUrl, apiUrl }) {
    this.baseUrl = baseUrl
    this.apiUrl = apiUrl

    this.oauth2 = new OAuth.OAuth2(
      consumerKey,
      consumerSecret,
      this.baseUrl,
      '/site/oauth2/authorize',
      '/site/oauth2/access_token',
      null
    )
  }

  async ensureAccessToken() {
    if (this.accessToken) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.oauth2.getOAuthAccessToken(
        '',
        {'grant_type': 'client_credentials'},
        // No need for refresh token
        (err, accessToken) => {
          if (err) {
            // build an error
            return reject(err)
          }
          this.accessToken = accessToken
          resolve()
        }
      )
    })
  }

  buildUrl(uri) {
    return `${this.apiUrl}${uri}`
  }

  async getHeaders() {
    // Initialize access token
    await this.ensureAccessToken()

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'User-Agent': 'turnup NPM module'
    }
  }

  getQueryParams() {
    return {
      limit: 1000
    }
  }

  async getOptions({ headers = {}, qs = {}, ...remainder } = {}) {
    const defaultHeaders = await this.getHeaders()

    return {
      headers: {
        ...defaultHeaders,
        ...headers
      },
      qs: querystring.stringify({
        ...this.getQueryParams(),
        ...qs
      }),
      ...remainder
    }
  }

  async getRepo(repoFullName) {
    const opts = await this.getOptions()

    const raw = await request.get(
      this.buildUrl(`/repositories/${repoFullName}`),
      opts
    )

    return JSON.parse(raw)
  }

  async getRepos(user) {
    const opts = await this.getOptions()

    const raw = await request.get(
      this.buildUrl(`/repositories/${user}`),
      opts
    )

    return JSON.parse(raw)
  }

  async getContents(repoFullName, ref, path) {
    const opts = await this.getOptions()

    return request.get(
      this.buildUrl(`/repositories/${repoFullName}/src/${ref}/${path}`),
      opts
    )
  }

  async getFileMeta(repoFullName, ref, path) {
    const opts = await this.getOptions()

    const raw = await request.get(
      this.buildUrl(`/repositories/${repoFullName}/src/${ref}/${path}?format=meta`),
      opts
    )

    return JSON.parse(raw)
  }

  async getBranch(repoFullName, branchName) {
    const opts = await this.getOptions()

    const raw = await request.get(
      this.buildUrl(`/repositories/${repoFullName}/refs/branches/${branchName}`),
      opts
    )

    return JSON.parse(raw)
  }

  async createBranch(repoFullName, ref, baseSha) {
    const opts = await this.getOptions({
      body: {
        name: ref,
        target: {
          hash: baseSha
        }
      },
      json: true
    })

    return await request.post(
      this.buildUrl(`/repositories/${repoFullName}/refs/branches`),
      opts
    )
  }

  async createContents(repoFullName, branch, path, sourceCommitId, contents, message) {
    const url = this.buildUrl(`/repositories/${repoFullName}/src`)
    const body = querystring.stringify({
      message,
      branch,
      [path]: contents
    })
    const opts = await this.getOptions({
      headers: {
        'Content-Length': body.length,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      qs: {
        sourceCommitId
      },
      body
    })

    return await request.post(url, opts)
  }

  async createPull(repoFullName, dest, src, title, description) {
    const opts = await this.getOptions({
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
    return await request.post(
      this.buildUrl(`/repositories/${repoFullName}/pullrequests`),
      opts
    )
  }
}

module.exports = Api
