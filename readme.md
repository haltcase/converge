# twitch-bot &middot; [![Version](https://img.shields.io/npm/v/twitch-bot.svg?style=flat-square&maxAge=3600)](https://www.npmjs.com/package/twitch-bot) [![License](https://img.shields.io/npm/l/twitch-bot.svg?style=flat-square&maxAge=3600)](https://www.npmjs.com/package/twitch-bot) [![Travis CI](https://img.shields.io/travis/citycide/twitch-bot.svg?style=flat-square&maxAge=3600)](https://travis-ci.org/citycide/twitch-bot) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square&maxAge=3600)](https://standardjs.com)

> NPM installable Twitch bot component.

## features

## installation

```console
$ npm i twitch-bot
```

## usage

```js
const twitchBot = require('twitch-bot')

twitchBot('universe')
//=> 'hello universe'

twitchBot('universe', { exclaim: true })
//=> 'hello universe!'
```

## api

### twitchBot(input, [options])

> **Arguments**

- `{string} input`
- `{Object} [options = {}]`

| key       | type      | default | description                  |
| :-------: | :-------: | :-----: | ---------------------------- |
| `exclaim` | `boolean` | `false` | Add an exclamation point.    |

> **Returns**

`string`: some greeting thing



## contributing

PRs accepted. Check out the [issues](https://github.com/citycide/twitch-bot/issues)!

## license

MIT © [citycide](https://github.com/citycide)
