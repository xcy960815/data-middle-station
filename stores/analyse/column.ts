/**
 * @desc 列 store
 */
export const useColumnStore = definePiniaStore<
  ColumnStore.ColumnKey,
  ColumnStore.ColumnState,
  ColumnStore.ColumnGetter,
  ColumnStore.ColumnAction
>('column', {
  state: () => ({
    columns: [
      {
        name: 'id',
        alias: 'id',
        comment: '主键',
        displyName: '主键',
        type: 'number',
        choosed: true
      },
      {
        name: 'name',
        alias: 'name',
        comment: '姓名',
        displyName: '姓名',
        type: 'string',
        choosed: true
      },
      {
        name: 'age',
        alias: 'age',
        comment: '年龄',
        displyName: '年龄',
        type: 'number',
        choosed: true
      }
    ]
  }),
  getters: {
    getColumns() {
      return () => {
        return this.columns
      }
    }
  },
  actions: {
    setColumns(columns: ColumnStore.Column[]) {
      this.columns = columns
    }
  }
})
