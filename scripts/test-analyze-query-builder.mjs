import assert from 'node:assert/strict'
import { createJiti } from 'jiti'

const jiti = createJiti(process.cwd() + '/', {
  alias: {
    '@': process.cwd()
  }
})

const { AnalyzeQueryBuilder } = jiti('./server/service/analyzeQueryBuilder.ts')
const { validateAnalyzeChartConfig } = jiti('./utils/validateAnalyzeChartConfig.ts')

const builder = new AnalyzeQueryBuilder()

const createContext = (tableName, columns) => {
  const normalizedTableName = builder.normalizeIdentifier(tableName, '数据源')
  return {
    tableName: normalizedTableName,
    quotedTableName: builder.quoteIdentifier(normalizedTableName),
    allowedColumns: new Set(columns.map((column) => builder.normalizeIdentifier(column, '字段')))
  }
}

const baseQuery = {
  dataSource: 'orderFacts',
  dimensions: [],
  measures: [],
  filters: [],
  orders: [],
  commonChartConfig: {
    analyzeDesc: '',
    limit: 100,
    shareStrategy: ''
  }
}

const context = createContext('orderFacts', ['createdAt', 'region', 'salesAmount', 'customerId', 'status'])

assert.deepEqual(
  validateAnalyzeChartConfig({
    chartType: 'table',
    dataSource: 'orderFacts',
    dimensions: [],
    measures: []
  }),
  {
    valid: false,
    message: '表格明细模式至少需要一个值'
  }
)

assert.deepEqual(
  validateAnalyzeChartConfig({
    chartType: 'table',
    dataSource: 'orderFacts',
    dimensions: [
      {
        columnName: 'region',
        columnType: 'varchar',
        columnComment: '区域',
        displayName: '区域'
      }
    ],
    measures: []
  }),
  {
    valid: false,
    message: '表格聚合模式至少需要一个值'
  }
)

assert.deepEqual(
  validateAnalyzeChartConfig({
    chartType: 'table',
    dataSource: 'orderFacts',
    dimensions: [],
    measures: [
      {
        columnName: 'salesAmount',
        columnType: 'decimal',
        columnComment: '销售额',
        displayName: '销售额'
      }
    ]
  }),
  {
    valid: true,
    message: ''
  }
)

assert.deepEqual(
  validateAnalyzeChartConfig({
    chartType: 'table',
    dataSource: 'orderFacts',
    dimensions: [
      {
        columnName: 'region',
        columnType: 'varchar',
        columnComment: '区域',
        displayName: '区域'
      }
    ],
    measures: [
      {
        columnName: 'salesAmount',
        columnType: 'decimal',
        columnComment: '销售额',
        displayName: '销售额'
      }
    ]
  }),
  {
    valid: true,
    message: ''
  }
)

const aggregateQuery = builder.buildAnalyzeDataQuery(
  {
    ...baseQuery,
    dimensions: [
      {
        columnName: 'createdAt',
        columnType: 'datetime',
        columnComment: '创建时间',
        displayName: '创建时间'
      }
    ],
    measures: [
      {
        columnName: 'salesAmount',
        columnType: 'decimal',
        columnComment: '销售额',
        displayName: '销售额'
      },
      {
        columnName: 'customerId',
        columnType: 'varchar',
        columnComment: '客户',
        displayName: '客户'
      }
    ],
    filters: [
      {
        columnName: 'status',
        columnType: 'varchar',
        columnComment: '状态',
        displayName: '状态',
        aggregationType: 'raw',
        filterType: 'eq',
        filterValue: 'paid'
      },
      {
        columnName: 'salesAmount',
        columnType: 'decimal',
        columnComment: '销售额',
        displayName: '销售额',
        filterType: 'gt',
        filterValue: '1000'
      }
    ],
    orders: [
      {
        columnName: 'createdAt',
        columnType: 'datetime',
        columnComment: '创建时间',
        displayName: '创建时间',
        orderType: 'asc',
        aggregationType: 'raw'
      },
      {
        columnName: 'salesAmount',
        columnType: 'decimal',
        columnComment: '销售额',
        displayName: '销售额',
        orderType: 'desc'
      }
    ]
  },
  context
)

assert.deepEqual(aggregateQuery, {
  sql: "select DATE_FORMAT(`created_at`, '%Y-%m-%d %H:%i:%s') AS `created_at`,SUM(`sales_amount`) AS `sales_amount`,COUNT(`customer_id`) AS `customer_id` from `order_facts` where `status` = ? group by DATE_FORMAT(`created_at`, '%Y-%m-%d %H:%i:%s') having SUM(`sales_amount`) > ? order by DATE_FORMAT(`created_at`, '%Y-%m-%d %H:%i:%s') ASC,SUM(`sales_amount`) DESC limit 100",
  params: ['paid', '1000']
})

const detailQuery = builder.buildAnalyzeDataQuery(
  {
    ...baseQuery,
    measures: [
      {
        columnName: 'createdAt',
        columnType: 'datetime',
        columnComment: '创建时间',
        displayName: '创建时间'
      },
      {
        columnName: 'region',
        columnType: 'varchar',
        columnComment: '区域',
        displayName: '区域'
      }
    ],
    filters: [
      {
        columnName: 'region',
        columnType: 'varchar',
        columnComment: '区域',
        displayName: '区域',
        aggregationType: 'raw',
        filterType: 'like',
        filterValue: 'East'
      }
    ],
    orders: [
      {
        columnName: 'createdAt',
        columnType: 'datetime',
        columnComment: '创建时间',
        displayName: '创建时间',
        orderType: 'desc'
      }
    ],
    commonChartConfig: {
      analyzeDesc: '',
      limit: 99999,
      shareStrategy: ''
    }
  },
  context
)

assert.deepEqual(detailQuery, {
  sql: "select DATE_FORMAT(`created_at`, '%Y-%m-%d %H:%i:%s') AS `created_at`,`region` AS `region` from `order_facts` where `region` LIKE ? order by `created_at` DESC limit 5000",
  params: ['%East%']
})

const tableDetailValueOnlyQuery = builder.buildAnalyzeDataQuery(
  {
    ...baseQuery,
    measures: [
      {
        columnName: 'salesAmount',
        columnType: 'decimal',
        columnComment: '销售额',
        displayName: '销售额',
        datasetAggregationType: 'sum'
      }
    ]
  },
  context
)

assert.deepEqual(tableDetailValueOnlyQuery, {
  sql: 'select `sales_amount` AS `sales_amount` from `order_facts` limit 100',
  params: []
})

const tableAggregateGroupAndValueQuery = builder.buildAnalyzeDataQuery(
  {
    ...baseQuery,
    dimensions: [
      {
        columnName: 'region',
        columnType: 'varchar',
        columnComment: '区域',
        displayName: '区域'
      }
    ],
    measures: [
      {
        columnName: 'salesAmount',
        columnType: 'decimal',
        columnComment: '销售额',
        displayName: '销售额',
        datasetAggregationType: 'avg'
      }
    ]
  },
  context
)

assert.deepEqual(tableAggregateGroupAndValueQuery, {
  sql: 'select `region` AS `region`,AVG(`sales_amount`) AS `sales_amount` from `order_facts` group by `region` limit 100',
  params: []
})

assert.throws(
  () =>
    builder.buildAnalyzeDataQuery(
      {
        ...baseQuery,
        dimensions: [
          {
            columnName: 'region',
            columnType: 'varchar',
            columnComment: '区域',
            displayName: '区域'
          }
        ],
        measures: [
          {
            columnName: 'salesAmount',
            columnType: 'decimal',
            columnComment: '销售额',
            displayName: '销售额'
          }
        ],
        orders: [
          {
            columnName: 'salesAmount',
            columnType: 'decimal',
            columnComment: '销售额',
            displayName: '销售额',
            orderType: 'desc',
            aggregationType: 'raw'
          }
        ]
      },
      context
    ),
  /聚合查询中，值字段排序需要选择总计、计数、平均等聚合方式/
)

console.log('Analyze query builder snapshots passed.')
