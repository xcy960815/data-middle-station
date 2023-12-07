// {
//   name: 'date',
//   alias: 'date',
//   comment: '日期',
//   displyName: '日期',
//   type: 'date',
//   choosed: true
// },
// {
//   name: 'bill',
//   alias: 'bill',
//   comment: '账单',
//   displyName: '账单',
//   type: 'number',
//   choosed: true
// },
// {
//   name: 'register',
//   alias: 'register',
//   comment: '注册',
//   displyName: '注册',
//   type: 'number',
//   choosed: true
// },
// {
//   name: 'download',
//   alias: 'download',
//   comment: '下载',
//   displyName: '下载',
//   type: 'number',
//   choosed: true
// }


/**
 * @desc 列 store
 */
export const useColumnStore = definePiniaStore<string,ColumnStore.ColumnState>('column', {
  state: () => ({
    dataSource:"",
    dataSourceOptions:[],
    columns: [
      
    ]
  }),
  getters: {
    getColumns() {
      return () => {
        return this.columns
      }
    },
    getDataSource() {
      return () => {
        return this.dataSource
      }
    },
    getDataSourceOptions(){
      return () => {
        return this.dataSourceOptions
      }
    }
  },
  actions: {
    setColumns(columns: ColumnStore.Column[]) {
      this.columns = columns
    },
    setDataSource(dataSource: string) {
      this.dataSource = dataSource
    },
    setDataSourceOptions(dataSourceOptions:ColumnStore.dataSourceOption[]) {
      this.dataSourceOptions = dataSourceOptions
    }
  }
})
