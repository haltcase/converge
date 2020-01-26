import * as types from '@converge/types'

export interface GroupsApi {
  getName (name: string): Promise<string>
  getLevel (name: string): Promise<number>
}

declare module '@converge/types' {
  interface UserApi {
    getGroup (user: string | UserObject): Promise<number>
  }

  interface Core {
    groups: GroupsApi
  }
}
