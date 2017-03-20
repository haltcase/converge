const strat = require('strat')
const filter = require('stunsail/filter')

const second = 1000
const minute = second * 60
const hour = minute * 60
const day = hour * 24

let parse = ms => {
  ms = Math.abs(ms) | 0

  return {
    days: (ms / day) | 0,
    hours: (ms / hour % 24) | 0,
    minutes: (ms / minute % 60) | 0,
    seconds: (ms / second % 60) | 0,
    milliseconds: (ms % 1000) | 0
  }
}

let defaultTemplate = [
  '{days}{daysLabel}',
  '{hours}{hoursLabel}',
  '{minutes}{minutesLabel}',
  '{seconds}{secondsLabel}'
].join(' ')

let defaultLabels = {
  days: 'd',
  hours: 'h',
  minutes: 'm',
  seconds: 's',
  milliseconds: 'ms'
}

let verboseLabels = {
  days: 'days',
  hours: 'hours',
  minutes: 'minutes',
  seconds: 'seconds',
  milliseconds: 'milliseconds'
}

let defaultOptions = {
  labels: defaultLabels,
  includeMilliseconds: false,
  removeZeroes: true,
  template: defaultTemplate,
  minimal: false
}

let duration = (duration, options) => {
  options = Object.assign(defaultOptions, options)

  let parsed = parse(duration)
  let { template } = options

  if (options.includeMilliseconds) {
    template += '{milliseconds}{millisecondsLabel}'
  }

  if (options.verbose) {
    options.labels = verboseLabels
  }

  if (options.removeZeroes) {
    parsed = filter((val, unit) => {
      let shouldKeep = val > 0
      if (!shouldKeep) {
        options.labels[unit] = ''
      }
      return shouldKeep
    }, parsed)
  }

  return strat(template, Object.assign(parsed, {
    daysLabel: options.labels.days,
    hoursLabel: options.labels.hours,
    minutesLabel: options.labels.minutes,
    secondsLabel: options.labels.seconds,
    millisecondsLabel: options.labels.milliseconds
  })).trim()
}

Object.assign(duration, {
  parse,
  day,
  hour,
  minute,
  second
})

module.exports = duration
