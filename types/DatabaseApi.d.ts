import { Model, SchemaRaw } from 'trilogy/dist/index'

type DefaultTableSchema<Keyed> = {
  key: Keyed extends true
    ? number
    : string,
  value: string,
  info: string
}

export interface DatabaseApi {
  addTable <Keyed extends boolean>(name: string, keyed: Keyed): Promise<Model<DefaultTableSchema<Keyed>>>
  addTableCustom <T extends Record<string, any>>(name: string, schema: SchemaRaw<T>): Promise<Model<T>>
  getConfig <T>(key: string, defaultValue: T): Promise<T>
  setConfig <T>(key: string, value: T): Promise<any>
  confirmConfig <T>(key: string, value: T): Promise<any>
  getExtConfig <T>(ext: string, defaultValue: T): Promise<T>
  setExtConfig <T>(ext: string, value: T): Promise<any>
  getRandomRow <T>(table: string, where: Partial<T>): Promise<T>
  exists (...args: Parameters<Model['findOne']>): Promise<boolean>
}
