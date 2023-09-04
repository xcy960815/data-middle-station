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
        name: 'date',
        alias: 'date',
        comment: '日期',
        displyName: '日期',
        type: 'date',
        choosed: true
      },
      {
        name: 'bill',
        alias: 'bill',
        comment: '账单',
        displyName: '账单',
        type: 'number',
        choosed: true
      },
      {
        name: 'register',
        alias: 'register',
        comment: '注册',
        displyName: '注册',
        type: 'number',
        choosed: true
      },
      {
        name: 'download',
        alias: 'download',
        comment: '下载',
        displyName: '下载',
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
