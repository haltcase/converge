const axios = require('axios')
const get = require('stunsail/get')
const once = require('stunsail/once')

const log = require('../logger')
const { clientID } = require('../constants')

module.exports = once(token => {
  token = token.startsWith('oauth:') ? token.slice(6) : token

  let instance = axios.create({
    baseURL: 'https://api.twitch.tv/kraken/',
    headers: {
      'Accept': 'application/vnd.twitchtv.v5+json',
      // 'Authorization': `OAuth ${token}`,
      'Client-ID': clientID
    },
    validateStatus (status) {
      // 404 can be assumed to mean not a follower, user doesn't exist, etc.
      // 503s are fairly common with Twitch and it's probably safe to drop it
      if (status === 404 || status === 503) return true
      return status >= 200 && status < 300
    }
  })

  return function api (endpoint, opts) {
    return instance(Object.assign({ url: endpoint }, opts))
      .then(get('data'))
      .catch(e => {
        let msg = get('response.data.message', e)
        log.error(`twitch-api  ${msg || 'Unknown error'}`)
        throw e
      })
  }
})
