import * as types from '@converge/types'

interface PointsApi {
  add (name: string, amount: number): Promise<Record<string, any>>
  sub (name: string, amount: number): Promise<Record<string, any>>
  str (amount: number): Promise<string>
  get (name: string, asString?: false): Promise<number>
  get (name: string, asString: true): Promise<string>
  set (name: string, value: number): Promise<Record<string, any>>
  getName (singular?: boolean): Promise<string>
  setName (name: string, singular: boolean): Promise<unknown>
  getPointName (singular: boolean): Promise<string>
  setPointName (name: string, singular: boolean): Promise<unknown>
  getPayoutAmount (offline: boolean): Promise<number>
  setPayoutAmount (amount: number, offline: boolean): Promise<unknown>
  getPayoutInterval (offline: boolean): Promise<number>
  setPayoutInterval (seconds: number | string, offline: boolean): Promise<unknown>
}

declare module '@converge/types' {
  interface CommandApi {
    getPrice (command: string, subcommand?: string): Promise<number>
    setPrice (command: string, price: number): Promise<undefined>
    setPrice (command: string, subcommand: string, price: number): Promise<undefined>
  }

  interface Core {
    points: PointsApi
  }
}
