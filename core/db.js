'use strict'

module.exports = (context, db) => {
  console.log('preparing database')

  let data = db

  data.getConfig = (key, defaultValue) => {
    return db.get('settings.value', { key }, defaultValue)
  }

  data.setConfig = (key, value) => {
    return db.set('settings.value', { key }, value)
  }

  data.confirmConfig = (key, value) => {
    return db.findOrCreate('settings', { key }, { value })
  }

  context.extend({ db: data })

  return Promise.all([
    db.model('settings', {
      key: { type: String, primary: true },
      value: String,
      info: String
    }),
    db.model('users', {
      id: { type: Number, primary: true },
      name: { type: String, unique: true },
      mod: Boolean,
      seen: Date
    })
  ]).then(() => data)
}
