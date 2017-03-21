'use strict'

const Promise = require('bluebird')

const log = require('../logger')

module.exports = (context, db) => {
  log.trace('preparing database')

  let data = db

  data.getConfig = (key, defaultValue) => {
    return db.get('settings.value', { key }, defaultValue)
  }

  data.setConfig = (key, value) => {
    return db.updateOrCreate('settings', { key }, { value })
  }

  data.confirmConfig = (key, value) => {
    return db.findOrCreate('settings', { key }, { value })
  }

  data.getExtConfig = (ext, defaultValue) => {
    let [plugin, key] = ext.split('.', 2)
    if (!plugin || !key) {
      return Promise.reject(new Error('invalid database identifier'))
    }
    return db.get('plugin_settings.value', { key, plugin }, defaultValue)
  }

  data.setExtConfig = (ext, value) => {
    let [plugin, key] = ext.split('.', 2)
    if (!plugin || !key || typeof value === 'undefined') {
      return Promise.reject(new Error('invalid database identifier'))
    }
    return db.updateOrCreate('plugin_settings', { key, plugin }, { value })
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
      mod: { type: Boolean, defaultTo: false },
      seen: Date
    }),
    db.model('usertypes', {
      id: { type: Number, primary: true },
      name: { type: String, unique: true },
      admin: { type: Boolean, defaultTo: false },
      mod: { type: Boolean, defaultTo: false }
    }),
    db.model('plugin_settings', {
      plugin: String,
      key: String,
      value: String,
      info: String
    }, {
      primary: ['plugin', 'key']
    })
  ]).then(() => data)
}
