/**
 * @typedef {import("@converge/types").CoreConfig} CoreConfig
 * @typedef {import("@converge/types").CoreOptions} CoreOptions
 */

import http from "http"
import { join } from "path"
import { URL } from "url"

import TOML from "@iarna/toml"
import FP from "functional-promises"
import got from "got"
import { writeAsync } from "fs-jetpack"
import { connect } from "trilogy"
import open from "open"

import Core from "./core"
import log from "./logger"
import { paths } from "./constants"

/**
 * @param {Record<string, string>} params
 */
const toQueryParams = params => {
  let result = "?"

  let i = 0
  for (const [key, value] of Object.entries(params)) {
    if (i++ > 0) result += "&"
    result += `${key}=${value}`
  }

  return result
}

/**
 * @param {CoreConfig} config
 * @param {CoreOptions} options
 * @returns {Promise<void>}
 */
const getAuthorization = (config, options) => {
  return new Promise((resolve, reject) => {
    const { port, hostname } = new URL(config.redirectUri)

    const server = http.createServer((req, res) => {
      if (!req.url) return

      const url = new URL(req.url, config.redirectUri)
      const code = url.searchParams.get("code")
      if (!code) {
        res.writeHead("400", "not ok")
        res.write("unable to authorize")
        res.end()
        return
      }

      res.writeHead(200, "ok")
      res.write("authorized")
      res.end()

      resolve(code)
      server.close()
    }).listen(port, hostname)

    const params = toQueryParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      force_verify: true,
      // scope: "chat:read+chat:edit",
      scope: config.scopes.join("+"),
      state: "converge-bot"
    })

    open(`https://id.twitch.tv/oauth2/authorize${params}`)
  })
}

/**
 * @param {CoreConfig} config
 * @param {CoreOptions} options
 */
const getAccessToken = async (config, options) => {
  const code = await getAuthorization(config, options)
  const params = toQueryParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri
  })

  try {
    return await got.post(`https://id.twitch.tv/oauth2/token${params}`)
  } catch (e) {
    log.error(e)
    throw e
  }
}

/**
 * @param {string} token
 * @returns {Promise<{ valid: boolean }>}
 */
const getTokenStatus = token =>
  got("https://id.twitch.tv/oauth2/validate", {
    headers: {
      Authorization: `OAuth ${token}`
    },
    responseType: "json"
  }).then(
    ({ body }) => ({ valid: true, ...body }),
    ({ body }) => ({ valid: false, ...body })
  )

/**
 * @param {CoreConfig} config
 * @param {boolean} isBot
 * @returns {Promise<{ valid: boolean }>}
 */
export const validateToken = async (config, isBot) => {
  if (isBot && (!config.bot?.auth || !config.bot?.refreshToken)) {
    return { valid: false }
  }

  if (!isBot && (!config.owner?.auth || !config.owner?.refreshToken)) {
    return { valid: false }
  }

  const token = isBot ? config.bot.auth : config.owner.auth
  const result = await getTokenStatus(token)
  if (!result.valid) {
    const target = isBot ? "bot" : "owner"
    log.error(
      `Unable to validate Twitch token for ${target}: ${result.message}`
    )
  }

  return result
}

/**
 * @param {CoreConfig} config
 * @param {CoreOptions} options
 */
export default async (config, options) => {
  log.trace("starting up...")
  options.db = connect(join(paths.data, "bot.db"))

  if (!config.owner?.auth || !config.owner?.refreshToken) {
    log.info("Please authenticate the owner's Twitch account...")

    const { data } = await getAccessToken(config, options)
    config.owner = {
      ...config.owner,
      auth: data.access_token,
      refreshToken: data.refresh_token
    }

    const validationResult = await validateToken(config)

    config.owner = {
      ...config.owner,
      name: validationResult.login,
      id: validationResult.user_id,
      expiration: validationResult.expires_in
    }
  }

  if (!config.bot?.auth || !config.bot?.refreshToken) {
    log.info("Please authenticate the bot's Twitch account...")

    const { data } = await getAccessToken(config, options)
    config.bot = {
      ...config.bot,
      auth: data.access_token,
      refreshToken: data.refresh_token
    }

    const validationResult = await validateToken(config, true)

    config.bot = {
      ...config.bot,
      name: validationResult.login,
      id: validationResult.user_id,
      expiration: validationResult.expires_in
    }
  }

  await writeAsync(options.configPath, TOML.stringify(config))

  return new Core(config, options)
}
