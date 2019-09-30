import { HelixUser } from 'twitch/lib/index'

export interface UserApi {
  isAdmin (id: string): Promise<boolean>
  isFollower (id: string): Promise<boolean>
  isMod (id: string): Promise<boolean>
  isSubscriber (id: string): Promise<boolean>
  getIdByName (name: string): Promise<boolean>
  resolveIdByName (name: string): Promise<boolean>
  resolveIdList (names: string[]): Promise<Record<string, string>>
  resolveNameById (id: string): Promise<string>
  resolveUserById (id: string): Promise<HelixUser>
  setAdmin (id: string, status: boolean): Promise<boolean>
  setMod (id: string, status: boolean): Promise<boolean>
  existsByName (name: string): Promise<boolean>
  existsById (id: string): Promise<boolean>
}
