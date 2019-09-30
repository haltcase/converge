import { LoggerNeue } from 'logger-neue/dist/index'

export interface LogApi extends LoggerNeue {
  (...args: any[]): void
  error(...args: any[]): void
  warn(...args: any[]): void
  info(...args: any[]): void
  debug(...args: any[]): void
  trace(...args: any[]): void
  absurd(...args: any[]): void
}
