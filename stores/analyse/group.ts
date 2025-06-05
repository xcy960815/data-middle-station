import { StoreNames } from '../store-names'
/**
 * @desc 分组 store
 */
import { defineStore } from 'pinia'
export const useGroupStore = defineStore<
  GroupStore.GroupKey,
  BaseStore.State<GroupStore.GroupState>,
  BaseStore.Getters<GroupStore.GroupState, GroupStore.GroupGetters>,
  BaseStore.Actions<GroupStore.GroupState, GroupStore.GroupActions>
>(StoreNames.GROUP, {
  state: () => ({
    groups: [],
  }),
  getters: {
    getGroups(state) {
      return state.groups
    },
  },
  actions: {
    /**
     * @desc 添加分组
     * @param groups {GroupOption[]}
     * @returns {void}
     */
    addGroups(groups) {
      this.groups = this.groups.concat(groups)
    },
    /**
     * @desc 设置分组
     * @param groups {GroupOption[]}
     * @returns {void}
     */
    setGroups(groups) {
      this.groups = groups
    },
    /**
     * @desc 删除分组
     * @param index {number}
     * @returns {void}
     */
    removeGroup(index: number) {
      this.groups.splice(index, 1)
    },
  },
})
