// let time = 0

export default {
  setup ($) {
    // called on plugin load
    // console.log('Hello, world!')
  },

  receivedCommand ($, e, prevent) {
    // called whenever the core receives a potential command
    // no checks for command existence or enabled status have happened yet
  },

  beforeCommand ($, e, prevent) {
    // called when the core is about to run a command
    // allows for an opportunity to stop the command from running
    // example: we'll only let citycide use a command every other attempt:
    // if (e.sender === 'citycide' && time++ % 2) e.prevent()
  },

  beforeMessage ($, e) {

  },

  preventedCommand ($, e) {
    // called whenever a command has been prevented by `event.prevent()`
  },

  afterCommand ($, e) {
    // called after any command is triggered
  }
}
