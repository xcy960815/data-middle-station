export const initData = () => {
  const groupStore = useGroupStore();
  /**
   * @desc groupList
   */
  const groupList = computed<GroupStore.GroupState['groups']>(() => {
    return groupStore.getGroups<'groups'>();
  });
  return {
    groupList,
  };
};
