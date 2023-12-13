export const useGroupStore = definePiniaStore<
  GroupStore.GroupKey,
  GroupStore.GroupState,
  GroupStore.GroupGetters<GroupStore.GroupState>,
  GroupStore.GroupActions
>('group', {
  state: () => ({
    groups: []
  }),
  getters: {
    getGroups: (state) => {
      return state.groups
    }
  },
  actions: {
    addGroups(groups) {
      this.groups = this.groups.concat(groups)
    },
    setGroups(groups) {
      this.groups = groups
    },
    removeGroup(index) {
      this.groups.splice(index, 1)
    }
  }
})
