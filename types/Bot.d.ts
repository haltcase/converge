import TwitchClient from 'twitch/lib/index'
import ChatClient from 'twitch-chat-client/lib/index'
import PubSubClient from 'twitch-pubsub-client/lib/index'
import WebhookClient from 'twitch-webhooks/lib/index'

export interface Bot {
  bot: ChatClient
  client: TwitchClient
  pubsub: PubSubClient
  webhooks: WebhookClient
}
