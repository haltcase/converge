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

`C:\Users\{user}\AppData\Roaming\converge\Config\config.toml`

```toml
ownerName = '...'
ownerAuth = 'oauth:...'
botName = '...'
botAuth = 'oauth:...'
```

You could also create this file manually.

## development

converge uses [Yarn workspaces][workspace-docs] to manage all the sources
as a monorepo, so make sure you've got [Yarn][yarn] installed.

1. Clone the repo: `git clone https://github.com/citycide/converge.git`
2. Move into the new directory: `cd converge`
3. Install dependencies: `yarn`
4. Build the source: `yarn dev`

To run without a rebuild, use `yarn start`.

## license

MIT © [Bo Lingen / citycide](https://github.com/citycide)

[yarn]: https://yarnpkg.com
[workspace-docs]: https://yarnpkg.com/docs/workspaces
