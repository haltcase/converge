export interface Quote {
  id?: number
  message: string
  credit?: string
  submitter?: string
  date?: string
  game?: string
}

export interface QuoteApi {
  add: (quote: Quote) => Promise<number | boolean>
  get: (id: number) => Promise<Required<Quote>>
  edit: (id: number, newData: Partial<Quote>) => Promise<boolean>
  remove: (id: number) => Promise<boolean>
}

declare module "@converge/types" {
  interface Core {
    quote: QuoteApi
  }
}
