import strat from 'strat'
import { filter } from 'stunsail'

const second = 1000
const minute = second * 60
const hour = minute * 60
const day = hour * 24

const parse = ms => {
  ms = Math.abs(ms) | 0

  return {
    days: (ms / day) | 0,
    hours: (ms / hour % 24) | 0,
    minutes: (ms / minute % 60) | 0,
    seconds: (ms / second % 60) | 0,
    milliseconds: (ms % 1000) | 0
  }
}

const defaultTemplate = [
  '{days}{daysLabel}',
  '{hours}{hoursLabel}',
  '{minutes}{minutesLabel}',
  '{seconds}{secondsLabel}'
].join(' ')

const defaultLabels = {
  days: 'd',
  hours: 'h',
  minutes: 'm',
  seconds: 's',
  milliseconds: 'ms'
}

const verboseLabels = {
  days: 'days',
  hours: 'hours',
  minutes: 'minutes',
  seconds: 'seconds',
  milliseconds: 'milliseconds'
}

const defaultOptions = {
  labels: defaultLabels,
  includeMilliseconds: false,
  removeZeroes: true,
  template: defaultTemplate,
  minimal: false
}

const duration = (duration, options) => {
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
    parsed = filter(parsed, (val, unit) => {
      const shouldKeep = val > 0
      if (!shouldKeep) {
        options.labels[unit] = ''
      }
      return shouldKeep
    })
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

export default duration
