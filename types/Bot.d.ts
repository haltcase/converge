import TwitchClient from 'twitch'
import ChatClient from 'twitch-chat-client'
import PubSubClient from 'twitch-pubsub-client'
import WebhookClient from 'twitch-webhooks'

export interface Bot {
  bot: ChatClient
  botClient: TwitchClient
  client: TwitchClient
  owner: ChatClient
  pubsub: PubSubClient
  webhooks?: WebhookClient
}
