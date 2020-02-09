/**
 * @type {import("@converge/types").PluginLifecycle<number>}
 */
export const lifecycle = {
  async setup ($) {
    // called on plugin load
    // we can use this to set up some state to use in other hooks
    // here, we say that `0` is the initial state
    // then we define actions we can call to modify that state:
    return $.store(0, {
      increment: () => attempts => attempts + 1
    })
  },

  async beforeMessage ($, e, store) {
    // called whenever chat receives a new message
  },

  async receivedCommand ($, e, store) {
    // called whenever the core receives a potential command
    // no checks for command existence or enabled status have happened yet
  },

  async beforeCommand ($, e, store) {
    // called when the core is about to run a command
    // this hook is an opportunity to stop the command from running
    // example: if we wanted to only let someone use a command every other attempt...

    if (e.sender === "some_user_who_hopefully_doesnt_actually_exist_what_are_the_odds") {
      // use the state & actions we set up in the `setup` hook above:
      const actions = store.getActions()
      actions.increment()

      if (store.getState() % 2 === 0) {
        console.log(`Sorry ${e.sender}, this wasn't your time...`)
        e.prevent()
      }
    }
  },

  async preventedCommand ($, e, store) {
    // called whenever a command has been prevented by `event.prevent()`
  },

  async afterCommand ($, e, store) {
    // called after any command is triggered
  }
}
