import { PluginLifecycle, PluginSetup } from "@converge/types"

interface State {
  count: number
}

const actions = {
  increment: () => (state: State) => { state.count += 1 }
}

export const lifecycle: PluginLifecycle<State, typeof actions> = {
  async setup ($) {
    return $.store({ count: 0 }, {
      increment: () => state => { state.count += 1 }
    })
  },

  async beforeMessage ($, e, store) {
    store.getActions().increment()
    // console.log(`${e.sender} has sent message #${store.getState().count}!`)
  }
}

export const setup: PluginSetup<State, typeof actions> = async ($, store) => {
  // console.log(`${store.getState().count}`)
}
