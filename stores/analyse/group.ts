export const useGroupStore = definePiniaStore<
  GroupStore.GroupKey,
  GroupStore.GroupState,
  GroupStore.GroupGetters,
  GroupStore.GroupActions
>('group', {
  state: () => ({
    groups: []
  }),
  getters: {
    getGroups: (state) => {
      return () => {
        return state.groups
      }
    }
  },
  actions: {
    addGroup(groups) {
      this.groups = this.groups.concat(groups)
    },
    updateGroup(groups) {
      this.groups = groups
    },
    removeGroup(index) {
      this.groups.splice(index, 1)
    }
  }
})
