export const useGroupStore = definePiniaStore<
  GroupStore.GroupKey,
  GroupStore.GroupState,
  GroupStore.GroupGetters<GroupStore.GroupState>,
  GroupStore.GroupActions
>('group', {
  state: () => ({
    groups: [
      {
        name: 'date',
        alias: 'date',
        comment: '日期',
        displyName: '日期',
        type: 'date',
        choosed: true
      }
    ]
  }),
  getters: {
    getGroups: (state) => {
      return state.groups
    }
  },
  actions: {
    // addGroup(groups) {
    //   this.groups = this.groups.concat(groups)
    // },
    setGroups(groups) {
      this.groups = groups
    },
    // removeGroup(index) {
    //   this.groups.splice(index, 1)
    // }
  }
})
