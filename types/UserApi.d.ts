import { HelixUser } from "twitch"

export interface UserApi {
  isAdmin (id: string): Promise<boolean>
  isFollower (id: string): Promise<boolean>
  isMod (id: string): Promise<boolean>
  isSubscriber (id: string): Promise<boolean>
  getFollowerCount (id: string): Promise<number>
  getIdByName (name: string): Promise<boolean>
  getNameById (id: string): Promise<boolean>
  resolveIdByName (name: string): Promise<boolean>
  resolveUserList (names: readonly string[]): Promise<Record<string, HelixUser>>
  resolveNameById (id: string): Promise<string>
  resolveUserById (id: string): Promise<HelixUser>
  setAdmin (id: string, status: boolean): Promise<boolean>
  setMod (id: string, status: boolean): Promise<boolean>
  existsByName (name: string): Promise<boolean>
  existsById (id: string): Promise<boolean>

  list: string[]
  count: number
}
