import { LoggerNeue } from 'logger-neue'

export interface LogApi extends LoggerNeue {
  (source: string, ...args: readonly unknown[]): void
  error (source: string, ...args: readonly unknown[]): void
  warn (source: string, ...args: readonly unknown[]): void
  info (source: string, ...args: readonly unknown[]): void
  debug (source: string, ...args: readonly unknown[]): void
  trace (source: string, ...args: readonly unknown[]): void
  absurd (source: string, ...args: readonly unknown[]): void
}
