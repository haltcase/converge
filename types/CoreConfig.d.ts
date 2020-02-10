export interface AuthInfo {
  auth: string
  refreshToken: string
  name: string
  id: string
  expiration: number
}

export interface PubSubConfig {
  enabled: boolean
}

export interface WebhooksConfig {
  enabled: boolean,
  port: number
}

export interface ConnectionConfig {
  pubsub: PubSubConfig
  webhooks: WebhooksConfig
}

export interface CoreConfig {
  redirectUri: string
  scopes: string[]
  clientId: string
  clientSecret: string

  owner: AuthInfo
  bot: AuthInfo

  connections: ConnectionConfig
}
