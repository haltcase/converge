import * as types from '@converge/types'

export interface RanksApi {
  getName (level: number): Promise<string>
  getLevel (name: string): Promise<number>
  getBonus (level: number): Promise<number>
  getAllowPurchases (): Promise<boolean>
  setAllowPurchases (): Promise<unknown>
}

declare module '@converge/types' {
  interface UserApi {
    getRank (): string
  }

  interface Core {
    ranks: RanksApi
  }
}
