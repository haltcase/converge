import { LoggerNeue } from 'logger-neue'

export interface LogApi extends LoggerNeue {
  (source: string, ...args: readonly unknown[]): void
  error (...args: readonly unknown[]): void
  warn (...args: readonly unknown[]): void
  info (...args: readonly unknown[]): void
  debug (...args: readonly unknown[]): void
  trace (...args: readonly unknown[]): void
  absurd (...args: readonly unknown[]): void
}
