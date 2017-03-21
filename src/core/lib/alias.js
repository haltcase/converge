'use strict'

module.exports = context => {
  return context.db.model('alias', { name: String, original: String })
    .then(() => {
      function addAlias (name, original) {
        let command = String(original).split(' ', 1)[0]
        if (context.command.exists(name)) return false
        if (!context.command.exists(command)) return false

        return context.db.create('alias', { name, original })
          .then(count => count === 1)
      }

      function removeAlias (name) {
        return context.db.remove('alias', { name })
          .then(count => count === 1)
      }
      
      function isAlias (name) {
        return context.db.findOne('alias', { name })
          .then(alias => alias && alias.original)
      }

      context.extend({
        command: {
          addAlias,
          removeAlias,
          isAlias
        }
      })
    })
}
