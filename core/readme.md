# converge

> Extensible command-line Twitch bot.

**NOTE**: This project is in flux and is intermittently maintained
at the time, so this readme will be minimal for the time being.

## features

* command-line interaction
* plugins

  Many features are implemented as built-in plugins:

  * administration
  * cooldowns
  * groups
  * notices
  * points
  * ranks
  * time tracking

  Plugins are just node modules, so they can have their own dependencies.
  They are also hot-loaded so that changes can be made while the bot is
  already running.

## usage

To clone & use `converge` from source:

```sh
git clone https://github.com/citycide/converge
cd converge
yarn && yarn dev
```

On first startup you'll be prompted to provide the required configuration,
like the owner & bot names, and OAuth tokens for each. This is then stored
in the OS config directory and used on future runs, for example on Windows:

`C:\Users\{user}\AppData\Local\converge\Config\config.json`

```json
{
  "ownerName": "...",
  "ownerAuth": "oauth:...",
  "botName": "...",
  "botAuth": "oauth:..."
}
```

You could also create this file manually.

## license

MIT © [citycide](https://github.com/citycide)
