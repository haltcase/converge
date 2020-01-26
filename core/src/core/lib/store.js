import { createStore } from '@converge/state'

export default async context => {
  context.extend({
    store: createStore
  })
}
