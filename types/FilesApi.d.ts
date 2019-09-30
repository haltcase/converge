export interface FilesApi {
  read (path: string): Promise<string>
  write (path: string, data: unknown): Promise<void>
  exists (path: string): Promise<void>
}
