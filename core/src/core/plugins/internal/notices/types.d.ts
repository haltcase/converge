import * as types from '@converge/types'

export interface NoticesApi {
  add (name: string, message: string): Promise<boolean>
  get (name: string): Promise<string>
  edit (name: string, message: string): Promise<boolean>
  remove (name: string, withCommand?: boolean): Promise<boolean>
}

declare module '@converge/types' {
  interface Core {
    notices: NoticesApi
  }
}
