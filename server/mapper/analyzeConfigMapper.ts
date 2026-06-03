import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { convertToSqlProperties } from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

class AnalyzeConfigMapping implements AnalyzeConfigDao.AnalyzeConfigRecord, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('analyze_id')
  analyzeId!: number

  @Column('version_no')
  versionNo!: number

  @Column('data_source')
  dataSource!: string | null

  @Column('chart_type')
  chartType!: string

  @Column('columns')
  columns: AnalyzeConfigDao.ColumnItem[] = []

  @Column('dimensions')
  dimensions: AnalyzeConfigDao.DimensionOption[] = []

  @Column('filters')
  filters: AnalyzeConfigDao.FilterOption[] = []

  @Column('groups')
  groups: AnalyzeConfigDao.GroupOption[] = []

  @Column('orders')
  orders: AnalyzeConfigDao.OrderOption[] = []

  @Column('common_chart_config')
  commonChartConfig!: AnalyzeConfigDao.CommonChartConfig

  @Column('private_chart_config')
  privateChartConfig!: AnalyzeConfigDao.PrivateChartConfig

  @Column('change_note')
  changeNote!: string

  @Column('create_time')
  createTime!: string

  @Column('update_time')
  updateTime!: string

  @Column('created_by')
  createdBy!: string

  @Column('is_deleted')
  isDeleted!: number
}

const ANALYZE_CONFIG_TABLE_NAME = 'analyze_config'
const DATA_SOURCE_NAME = 'data_middle_station'

const ANALYZE_CONFIG_FIELDS = [
  'id',
  'analyze_id',
  'version_no',
  'chart_type',
  'data_source',
  'columns',
  'dimensions',
  'filters',
  'groups',
  'orders',
  'common_chart_config',
  'private_chart_config',
  'change_note',
  'create_time',
  'update_time',
  'created_by',
  'is_deleted'
]

export class AnalyzeConfigMapper extends BaseMapper {
  public dataSourceName = DATA_SOURCE_NAME

  @Mapping(AnalyzeConfigMapping)
  public async getAnalyzeConfig<T extends AnalyzeConfigDao.AnalyzeConfigRecord = AnalyzeConfigDao.AnalyzeConfigRecord>(
    getConfigParams: AnalyzeConfigDao.GetAnalyzeConfigParams
  ): Promise<T> {
    const { keys, values } = convertToSqlProperties(getConfigParams)
    const whereClauses: string[] = []
    const queryValues: any[] = []

    keys.forEach((key, index) => {
      if (ANALYZE_CONFIG_FIELDS.includes(key)) {
        const formattedKey = ['groups', 'orders', 'columns', 'dimensions', 'filters'].includes(key) ? `\`${key}\`` : key
        whereClauses.push(`${formattedKey} = ?`)
        queryValues.push(values[index])
      }
    })

    if (!keys.includes('is_deleted')) {
      whereClauses.push('is_deleted = 0')
    }

    const sql = `
      select ${batchFormatSqlKey(ANALYZE_CONFIG_FIELDS)}
      from ${ANALYZE_CONFIG_TABLE_NAME}
      where ${whereClauses.join(' and ')}`
    const result = await this.exe<Array<T>>(sql, queryValues)
    return result?.[0]
  }

  @Mapping(AnalyzeConfigMapping)
  public async getAnalyzeConfigHistory<
    T extends AnalyzeConfigDao.AnalyzeConfigRecord = AnalyzeConfigDao.AnalyzeConfigRecord
  >(analyzeId: number): Promise<Array<T>> {
    const sql = `
      select ${batchFormatSqlKey(ANALYZE_CONFIG_FIELDS)}
      from ${ANALYZE_CONFIG_TABLE_NAME}
      where analyze_id = ? and is_deleted = 0
      order by version_no desc, id desc`
    return await this.exe<Array<T>>(sql, [analyzeId])
  }

  public async getNextVersionNo(analyzeId: number): Promise<number> {
    const sql = `
      select coalesce(max(version_no), 0) + 1 as nextVersionNo
      from ${ANALYZE_CONFIG_TABLE_NAME}
      where analyze_id = ?`
    const result = await this.exe<Array<{ nextVersionNo: number }>>(sql, [analyzeId])
    return Number(result?.[0]?.nextVersionNo || 1)
  }

  public async createAnalyzeConfig(createParams: AnalyzeConfigDao.CreateAnalyzeConfigParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(createParams)
    const validKeys = keys.filter((key) => ANALYZE_CONFIG_FIELDS.includes(key))
    const validValues = validKeys.map((key) => values[keys.indexOf(key)])
    const sql = `
      insert into ${ANALYZE_CONFIG_TABLE_NAME}
        (${batchFormatSqlKey(validKeys)})
      values (${validKeys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, validValues)
    return result.insertId || 0
  }

  public async deleteAnalyzeConfigs(deleteParams: AnalyzeConfigDao.DeleteAnalyzeConfigsParams): Promise<boolean> {
    const sql = `
      update ${ANALYZE_CONFIG_TABLE_NAME}
      set is_deleted = 1, update_time = ?
      where analyze_id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [deleteParams.updateTime, deleteParams.analyzeId])
    return result.affectedRows > 0
  }
}
