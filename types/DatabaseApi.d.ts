import { Model, SchemaRaw } from 'trilogy'

export type TableSchemaDefault = {
  key: string
  value: string
  info: string
}

export type TableSchemaKeyed = {
  key: number
  value: string
  info: string
}

export type TableSchema <Keyed = false> =
  Keyed extends true ? TableSchemaKeyed : TableSchemaDefault

export interface DatabaseApi {
  addTable <Keyed extends boolean> (name: string, keyed: Keyed): Promise<Model<TableSchema<Keyed>>>
  addTableCustom <T extends Record<string, unknown>> (name: string, schema: SchemaRaw<T>): Promise<Model<T>>
  getConfig <T> (key: string, defaultValue: T): Promise<T>
  setConfig <T> (key: string, value: T): Promise<unknown>
  confirmConfig <T> (key: string, value: T): Promise<unknown>
  getPluginConfig <T> (pluginAndKey: string, defaultValue: T): Promise<T>
  setPluginConfig <T> (pluginAndKey: string, value: T): Promise<unknown>
  getRandomRow <T> (table: string, where?: Partial<T>): Promise<T>
  exists (table: string, ...args: Parameters<Model['findOne']>): Promise<boolean>
}
