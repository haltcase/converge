export interface AuthInfo {
  auth: string
  refreshToken: string
  name: string
  id: string
  expiration: number
}

export interface CoreConfig {
  redirectUri: string
  scopes: string[]
  clientId: string
  clientSecret: string

  owner: AuthInfo
  bot: AuthInfo
}
