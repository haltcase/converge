import * as types from '@converge/types'

export interface TimeApi {
  getPayoutInterval (offline?: boolean): Promise<number>
  setPayoutInterval (seconds: number | string, offline?: boolean): Promise<unknown>
}

declare module '@converge/types' {
  interface Core {
    time: TimeApi
  }
}
