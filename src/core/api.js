import { _ } from 'param.macro'

import axios from 'axios'
import {
  any,
  isInRange,
  isOneOf,
  once
} from 'stunsail'

import log from '../logger'
import { clientID } from '../constants'

export default once(token => {
  token = token.startsWith('oauth:') ? token.slice(6) : token

  const instance = axios.create({
    baseURL: 'https://api.twitch.tv/kraken/',
    headers: {
      'Accept': 'application/vnd.twitchtv.v5+json',
      // 'Authorization': `OAuth ${token}`,
      'Client-ID': clientID
    },
    // 404 can be assumed to mean not a follower, user doesn't exist, etc.
    // 503s are fairly common with Twitch and it's probably safe to drop it
    validateStatus: status => any([
      isOneOf(status, [404, 503]),
      isInRange(status, 200, 299)
    ])
  })

  return async (endpoint, opts, defaultValue) => {
    let data
    try {
      ;({ data } = await instance(Object.assign({ url: endpoint }, opts)))
    } catch (e) {
      if (e.code === 'ENOTFOUND') {
        log.trace(`twitch-api: ignoring generic error (${e.message})`)
        return defaultValue
      }

      if (e.code === 'ETIMEDOUT') {
        log.trace(`twitch-api: connection timed out`)
        return defaultValue
      }

      e.response?.data?.message || 'Unknown Error' |>
        log.error(`twitch-api :: ${_}`)

      throw e
    }

    return data ?? defaultValue
  }
})
