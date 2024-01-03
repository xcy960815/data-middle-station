<template>
    <div :style="{
        height: chartHeight + 'px'
    }" class="chart flex-column" ref="chart">
        <div class="table-scroll" :class="{ 'table-scroll-y': showScrollY }">
            <table v-if="!hasPivotTable" class="table table-hover table-striped">
                <thead>
                    <tr>
                        <th v-for="(fieldOption, idx) in fields" :key="idx" class="table-fixed-top"
                            @click="_emitOrder(fieldOption.name)">
                            <span style="min-height: 27px;display:flex;align-items: center;padding: 0 0.75rem;">{{
                                fieldOption.displayName || fieldOption.alias || fieldOption.name }}</span>
                            <i v-show="order.field === fieldOption.name && order.type" class="iconfont" :class="{
                                'icon-asc': order.type === 'asc',
                                'icon-desc': order.type === 'desc'
                            }"></i>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, idx) in tableRenderData" :key="idx">
                        <td v-for="(field, i) in fields" :class="getComparedClass(row, field)" :key="i"
                            v-html="getComparedContent(row, field, idx)"></td>
                    </tr>
                </tbody>
            </table>
            <pivotTable v-else :tableData="pivotTableData" :pageNum="pageNum" :pageSize="pivotPageSize"
                :aliasMap="aliasMap"></pivotTable>
        </div>

        <div class="table-pagination d-flex justify-content-end mr-4 align-items-center" ref="pagination">
            <!-- 普通表格分页器 -->
            <template v-if="!hasPivotTable">
                <span class="indicator">第{{ pageNum * rowCountPerPage + 1 - (pageNum === 0 ? 0 : firstPageRowDif) }}-{{
                    (pageNum + 1) * rowCountPerPage > rawTableData.length ? rawTableData.length : (pageNum + 1) *
                    rowCountPerPage - firstPageRowDif
                }}条<span class="pd">共{{ Math.ceil((rawTableData.length + firstPageRowDif) / rowCountPerPage) }}页{{
    rawTableData.length }}条</span></span>

                <i :class="[
                    'iconfont',
                    'icon-diyiye',
                    {
                        disabled: pageNum === 0
                    }
                ]" @click="gotoPage(0)"></i>
                <i :class="[
                    'iconfont',
                    'icon-arrow-left-no-radius-copy',
                    {
                        disabled: pageNum === 0
                    }
                ]" @click="prevPage"></i>
                <input class="pageInput" type="number" @change="changePageNum" :value="Number(pageNum) + 1" min="1"
                    :max="Math.ceil(rawTableData.length / rowCountPerPage)" />
                <i :class="[
                    'iconfont',
                    'icon-arrow-no-radius',
                    {
                        disabled: rawTableData.length <= (pageNum + 1) * rowCountPerPage
                    }
                ]" @click="nextPage"></i>
                <i :class="[
                    'iconfont',
                    'icon-zuihouyiye',
                    {
                        disabled: rawTableData.length <= (pageNum + 1) * rowCountPerPage
                    }
                ]" @click="gotoPage(Math.ceil((rawTableData.length + firstPageRowDif) / rowCountPerPage) - 1)"></i>
            </template>
            <!-- 聚合表格的分页器 -->
            <template v-else>
                <span class="indicator">
                    第{{ pageNum * pivotPageSize + 1 }}-{{ (pageNum + 1) * pivotPageSize > pivotTableData.body.length ?
                        pivotTableData.body.length : (pageNum + 1) * pivotPageSize }}条
                    <span class="pd">共{{ Math.ceil(pivotTableData.body.length / rowCountPerPage) }}页{{
                        pivotTableData.body.length }}条</span>
                </span>

                <i :class="[
                    'iconfont',
                    'icon-diyiye',
                    {
                        disabled: pageNum === 0
                    }
                ]" @click="gotoPage(0)"></i>
                <i :class="[
                    'iconfont',
                    'icon-arrow-left-no-radius-copy',
                    {
                        disabled: pageNum === 0
                    }
                ]" @click="prevPage"></i>
                <input class="pageInput" type="number" @change="changePageNum" :value="Number(pageNum) + 1" min="1"
                    :max="Math.ceil(pivotTableData.body.length / rowCountPerPage)" />
                <i :class="[
                    'iconfont',
                    'icon-arrow-no-radius',
                    {
                        disabled: pivotTableData.body.length <= (pageNum + 1) * rowCountPerPage
                    }
                ]" @click="nextPage('pivot-table')"></i>
                <i :class="[
                    'iconfont',
                    'icon-zuihouyiye',
                    {
                        disabled: pivotTableData.body.length <= (pageNum + 1) * rowCountPerPage
                    }
                ]" @click="gotoPage(Math.ceil(pivotTableData.body.length / rowCountPerPage) - 1)"></i>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
//39是每一行的高度
//height - pagination_height = 表格区域的高度
//表格区域的高度 / 39 = rowCountPerPage
import * as _ from 'lodash';
import { formatData } from '../utils';
import { formatMoreGroupData, isDate } from './chartUtils';
import { getTimestamp, isDateType } from './helper/index';
import { columnHasModel, DataModels, Condition } from '../chartEditor/module/data-model-util';
import { Field } from '../../../common/type';
import pivotTable from '../pivot-table/index.vue';
import { pivot } from '../pivot-table/pivot';
export default {
    props: {
        data: {
            type: Array,
            default: () => []
        },
        chartHeight: {
            type: [Number, String],
            required: true,
            default: 290
        },
        editorType: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            rawTableData: [], // 未加工的chartData
            temRawTableData: [], // 未加工的chartData
            tableData: [], // 未经过格式化的当页显示的数据
            tableRenderData: [], // 经过格式化,同比环比处理后表格渲染的数据
            rowCountPerPage: 10,
            pageNum: 0,
            // firstRenderedHideHeader: true,
            fields: [], // 所有的原始列信息
            comparedDataValid: false,
            dateFieldInTable: null, // 记录是否有表示日期的列
            dateFieldDrection: 'vertical', // 日期列的展示方向 vertical(垂直)/horizontal(水平)
            order: {
                field: undefined,
                type: undefined
            }, // 点击表头排序的列
            orderEmit: false, //记录是否触发了点击表头的事件，点击之后第一次data改变不用重置order
            // jumpPage:0,
            firstPageRowDif: 0, //首页行的差值，记录是否有同比环比等信息
            showScrollY: false,
            tableRenderDataMap: [] //记录表格渲染数据的map
        };
    },
    components: {
        pivotTable
    },
    computed: {
        originData() {
            return _.cloneDeep(this.data[0]);
        },
        pivotPageSize() {
            if (this.pivotTableData && this.pivotTableData.colHeader && this.pivotTableData.colHeader.length) {
                return this.rowCountPerPage - this.pivotTableData.colHeader.length;
            } else {
                return 0;
            }
        },
        dataModel() {
            return this.originData.chartConfig.dataModel;
        },
        graphDetail() {
            return this.originData.graphDetail;
        },
        chartConfig() {
            return this.originData.chartConfig;
        },
        // 是否存在聚合表格
        hasPivotTable() {
            return this.graphDetail.origin === false && this.chartConfig.group.length;
        },
        aliasMap() {
            const fields = this.chartConfig.group.concat(this.chartConfig.dimension);
            const aliasMap = {};
            fields.forEach(t => {
                aliasMap[t.alias || t.name] = t.displayName || t.alias || t.name;
            });
            return aliasMap;
        },
        pivotTableData() {
            if (!this.hasPivotTable) return {};
            // const originData = _.cloneDeep(this.data[0]);

            const fields = this.chartConfig.group.concat(this.chartConfig.dimension);
            const pivotData = this._getFormatTalbeData(this.originData.chartData, fields);
            const mapFunction = t => {
                if (t.name === '_') {
                    return '_';
                } else {
                    return t.alias || t.name;
                }
            };
            if (!this.graphDetail.groupConfig) {
                return {};
            }

            const pivotRows = this.originData.graphDetail.groupConfig.row.map(mapFunction);
            const pivotCols = this.originData.graphDetail.groupConfig.column.map(mapFunction);
            const pivotValues = this.originData.chartConfig.dimension.map(mapFunction);
            const data = pivot({
                data: pivotData,
                rows: pivotRows,
                cols: pivotCols,
                values: pivotValues
            });
            return data;
        }
    },
    mounted() {
        this.$emit('renderStart');
        this._initChart();
        this.$emit('renderEnd');
    },
    methods: {
        // 是不是 卖家ID 列
        columnIsSellerId(column: Field): boolean {
            return columnHasModel(column, DataModels.sellerId, this.dataModel);
        },
        // 是不是 商品ID 列
        columnIsItemId(column: Field): boolean {
            return columnHasModel(column, DataModels.itemId, this.dataModel);
        },
        // 是不是 作者ID 列
        columnIsAuthorId(column: Field): boolean {
            return columnHasModel(column, DataModels.authorId, this.dataModel);
        },
        // 是不是 动态ID 列
        columnIsFeedId(column: Field): boolean {
            return columnHasModel(column, DataModels.feedId, this.dataModel);
        },
        // 是不是 视频ID 列
        columnIsVideoId(column: Field): boolean {
            return columnHasModel(column, DataModels.videoId, this.dataModel);
        },
        // 是不是 图片Url列
        columnIsImage(column: Field): boolean {
            return columnHasModel(column, DataModels.imgId, this.dataModel);
        },
        // 通过value获取相对应的色阶
        getColorByValue(orginRow: { [key: string]: any }, field: Field, colorConfigOption): string {
            const color = colorConfigOption.color.replace(/rgb\(|\)/g, '');
            const colorArr = color.split(',');
            const r = Number(colorArr[0]);
            const g = Number(colorArr[1]);
            const b = Number(colorArr[2]);
            // 当前的原始值
            const currentValue = orginRow[field.alias || field.name] ? orginRow[field.alias || field.name] : 0;
            // 这里要使用未加工过的数据 全部数据 需要按照现在页数进行分页
            const currentRowValueList = this.rawTableData.map(t => (t[field.alias || field.name] === undefined ? 0 : t[field.alias || field.name]));
            // 最大值
            const maxValue = Math.max(...currentRowValueList);
            // 最小值
            const minValue = Math.min(...currentRowValueList);
            // 最大值最小值的差
            const valueDif = maxValue - minValue;
            const R = 256 - (256 - r) * ((currentValue - minValue) / valueDif);
            const G = 256 - (256 - g) * ((currentValue - minValue) / valueDif);
            const B = 256 - (256 - b) * ((currentValue - minValue) / valueDif);
            return `rgb(${R},${G},${B})`;
        },
        getOtherHtmlTemplate(row: { [key: string]: any }, field: Field, idx: number): string {
            const orginRow = this.temRawTableData[idx];
            // 获取颜色配置
            const colorConfigList = this.graphDetail.colorConfigList || [];
            const templateValue = row[field.alias] !== undefined && row[field.alias] !== null ? row[field.alias] : '';
            // 当前行的属性对象
            const rowMap = this.tableRenderDataMap[idx][field.alias];
            rowMap.otherHtmlTemplate = rowMap.otherHtmlTemplate.replace(/currentValue/g, templateValue);
            const currentValue = orginRow[field.alias];
            // 当前行的属性对象的key
            for (let i = 0; i < colorConfigList.length; i++) {
                const colorConfigOption = colorConfigList[i];
                if (colorConfigOption.fieldName === field.alias) {
                    if (colorConfigOption.colorType === '单色') {
                        if (Condition.equal === colorConfigOption.condition && currentValue === colorConfigOption.value && !rowMap.isChanged) {
                            // 相等
                            rowMap.otherHtmlTemplate = rowMap.otherHtmlTemplate.replace(/#727479/g, colorConfigOption.color);
                            rowMap.isChanged = true;
                        } else if (Condition.greaterThan === colorConfigOption.condition && currentValue > colorConfigOption.value && !rowMap.isChanged) {
                            // 当前值大于预设值
                            rowMap.otherHtmlTemplate = rowMap.otherHtmlTemplate.replace(/#727479/g, colorConfigOption.color);
                            rowMap.isChanged = true;
                        } else if (Condition.lessThan === colorConfigOption.condition && currentValue < colorConfigOption.value && !rowMap.isChanged) {
                            // 当前值小于预设值
                            rowMap.otherHtmlTemplate = rowMap.otherHtmlTemplate.replace(/#727479/g, colorConfigOption.color);
                            rowMap.isChanged = true;
                        } else if (
                            Condition.between === colorConfigOption.condition &&
                            ((colorConfigOption.value2 >= currentValue && currentValue >= colorConfigOption.value) || (colorConfigOption.value2 <= currentValue && currentValue <= colorConfigOption.value)) &&
                            !rowMap.isChanged
                        ) {
                            // 区间
                            rowMap.otherHtmlTemplate = rowMap.otherHtmlTemplate.replace(/#727479/g, colorConfigOption.color);
                            rowMap.isChanged = true;
                        } else if (Condition.greaterThanOrEqual === colorConfigOption.condition && currentValue >= colorConfigOption.value && !rowMap.isChanged) {
                            // 大于等于
                            rowMap.otherHtmlTemplate = rowMap.otherHtmlTemplate.replace(/#727479/g, colorConfigOption.color);
                            rowMap.isChanged = true;
                        } else if (Condition.lessThanOrEqual === colorConfigOption.condition && currentValue <= colorConfigOption.value && !rowMap.isChanged) {
                            // 小于等于
                            rowMap.otherHtmlTemplate = rowMap.otherHtmlTemplate.replace(/#727479/g, colorConfigOption.color);
                            rowMap.isChanged = true;
                        }
                    } else if (colorConfigOption.colorType === '色阶') {
                        rowMap.otherHtmlTemplate = rowMap.otherHtmlTemplate.replace(/transparent/g, this.getColorByValue(orginRow, field, colorConfigOption));
                    }
                }
            }

            return rowMap.otherHtmlTemplate;
        },
        // 获取v-html显示的内容
        getComparedContent(row: { [key: string]: any }, field: Field, idx: number): string {
            let htmlTemplate;
            const templateValue = row[field.alias] !== undefined && row[field.alias] !== null ? row[field.alias] : '';
            if (this.columnIsSellerId(field)) {
                htmlTemplate = `<a title="查看商家详细信息" target="_blank" href="http://b.vdian.net/QA/mmsfront/#/shop-query?shopId=${templateValue}">${templateValue}</a>`;
            } else if (this.columnIsItemId(field)) {
                htmlTemplate = `<a title="查看商品详情" target="_blank" href="https://weidian.com/item.html?itemID=${templateValue}">${templateValue}</a>`;
            } else if (this.columnIsAuthorId(field)) {
                htmlTemplate = `<a title="查看作者详情" target="_blank" href="https://h5.weidian.com/m/koubei/personal.html?userId=${templateValue}">${templateValue}</a>`;
            } else if (this.columnIsFeedId(field)) {
                htmlTemplate = `<a title="查看动态详情" target="_blank" href="http://gibson.vdian.net/#/index/contentAnalysisV2?feedId=${templateValue}">${templateValue}</a>`;
            } else if (this.columnIsVideoId(field)) {
                htmlTemplate = `<a title="查看视频详情" target="_blank" href="http://gibson.vdian.net/#/index/auditList?feedId=${templateValue}">${templateValue}</a>`;
            } else if (this.columnIsImage(field)) {
                const imgUrl = row[field.alias] || '';
                const isImgUrl = imgUrl && imgUrl.indexOf('http') === 0;
                if (isImgUrl) {
                    htmlTemplate = `<img src='${row[field.alias]}' width="80px" height="80px" alt="图片加载失败"/>`;
                } else {
                    htmlTemplate = imgUrl;
                }
            } else {
                // 如果开启了同比环比就不做处理 临时方案
                if (this.graphDetail.compare) {
                    htmlTemplate = `${templateValue}`;
                } else {
                    htmlTemplate = this.getOtherHtmlTemplate(row, field, idx);
                }
            }
            // 判断 htmlTemplate 是否被 p标签包裹
            if (htmlTemplate.indexOf('<p>') === -1 && htmlTemplate.indexOf('</p>') === -1) {
                htmlTemplate = `<p style="min-height: 27px;display:flex;padding: 0 0.75rem;align-items: center;">${htmlTemplate}</p>`;
            }

            return htmlTemplate;
        },
        _initChart() {
            this.pageNum = 0;
            this._onHeightChangeBind = _.debounce(this._onHeightChange, 500);
            this._setRowCount();
            this._setSourceData();
            this._setTableData();
        },
        canDataValid() {
            // 能不能加同比环比
            if (this.graphDetail.compare) {
                if ((this.dateFieldDrection === 'vertical' && this.pageNum === 0) || this.dateFieldDrection === 'horizontal') {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },

        _comparedTableData(tableData: Array<any>): Array<any> {
            //找到与第一个日期相隔一周相同的行
            //如果是数字则计算同比，环比
            //把计算的两行插入数组
            const cloneTaleData = _.cloneDeep(tableData);
            //不要直接改computed里面的值，会有坑

            if (!this.fields.length) return [];
            // 如果开关未开启则返回原有数据
            if (!this.canDataValid()) {
                return this._getFormatTalbeData(cloneTaleData);
            }

            const dateField = this.dateFieldInTable;
            if (!dateField) {
                this.$alert('未找到日期列，请将格式为日期，或者格式为字符串但符合日期格式的列，拖到图表第一项中');
                this.comparedDataValid = false;
                return this._getFormatTalbeData(cloneTaleData);
            }
            this.comparedDataValid = true;
            let timestamp;
            let todayRow;
            let todayColumn;
            let yesterdayRow;
            let yesterdayColumn;
            let lastWeekColumn;
            let lastWeekRow;
            /**
             * @desc 从哪一天开始算
             * @returns 时间戳
             */
            const findRowByTimestamp = (fieldName, timestamp, rawTableData) => {
                for (let i = 0; i < rawTableData.length; i++) {
                    //当前值是否是后一天的
                    if (new Date(rawTableData[i][fieldName]).getTime() === timestamp) {
                        return _.cloneDeep(rawTableData[i]);
                    }
                }
                //没有找到返回null
                return null;
            };

            const findRowByTimestampRange = (dateField: string, startTimestamp: number, endTimestamp: number, rawTableData: any[]) => {
                return rawTableData.filter(item => {
                    let time = new Date(item[dateField]).getTime();
                    return startTimestamp < time && time <= endTimestamp;
                });
            };

            const findColumnByTimestamp = (fields, timestamp, regexp) => {
                for (let i = 0; i < fields.length; i++) {
                    //当前值是否是后一天的
                    let field = fields[i];
                    if (new Date(field.alias.match(regexp)[0]).getTime() === timestamp) {
                        return _.cloneDeep(field);
                    }
                }
                //没有找到返回null
                return null;
            };

            const calcDayCompareforRow = (dateField, fields, currentDayRow, nextDayRow) => {
                let row = {};
                fields.forEach((field, idx) => {
                    let fieldName = field.alias;
                    if (fieldName === dateField.alias) {
                        row[fieldName] = '昨日环比';
                    } else {
                        if (field.type === 'number' || field.type === 'int' || field.type === 'float') {
                            row[fieldName] = ((parseFloat(currentDayRow[fieldName]) / parseFloat(nextDayRow[fieldName]) - 1) * 100).toFixed(2) + '%';
                        } else {
                            row[fieldName] = 'N/A';
                        }
                    }
                });
                return row;
            };

            const calcDayCompareforColumn = (data, currentDayField, newDayField) => {
                return newDayField ? ((parseFloat(data[currentDayField.alias]) / parseFloat(data[newDayField.alias]) - 1) * 100).toFixed(2) + '%' : 'N/A';
            };

            // 一天有多少毫秒
            const oneDayMillionSecond = 86400000;
            if (this.dateFieldDrection === 'vertical') {
                // 垂直方向
                todayRow = _.cloneDeep(this.rawTableData[0]);
                timestamp = getTimestamp(this.rawTableData[0][dateField.alias]);
                yesterdayRow = findRowByTimestamp(dateField.alias, timestamp - oneDayMillionSecond, this.rawTableData);
                lastWeekRow = findRowByTimestamp(dateField.alias, timestamp - oneDayMillionSecond * 7, this.rawTableData);
                //都存在的时候
                if (todayRow) {
                    let yesterdayRowData;
                    if (yesterdayRow) {
                        yesterdayRowData = calcDayCompareforRow(dateField, this.fields, todayRow, yesterdayRow);
                        yesterdayRowData[dateField.alias] = '昨日环比';
                    } else {
                        yesterdayRowData = {};
                        yesterdayRowData[dateField.alias] = '昨日环比';
                        this.fields.forEach(field => {
                            if (field.alias !== dateField.alias) {
                                yesterdayRowData[field.alias] = 'N/A';
                            }
                        });
                    }

                    const todayTimestamp = getTimestamp(this.rawTableData[0][dateField.alias]);
                    const oneDayMillionSecond = 24 * 60 * 60 * 1000;
                    const days7AgoTimestamp = [todayTimestamp - 7 * oneDayMillionSecond, todayTimestamp];
                    const last7to14AgoTimestamp = [todayTimestamp - 14 * oneDayMillionSecond, todayTimestamp - 7 * oneDayMillionSecond];
                    const days7AgoRows = findRowByTimestampRange(dateField.alias, days7AgoTimestamp[0], days7AgoTimestamp[1], this.rawTableData);

                    const days7to14AgoRows = findRowByTimestampRange(dateField.alias, last7to14AgoTimestamp[0], last7to14AgoTimestamp[1], this.rawTableData);
                    let lastWeekRowDataRatio = {}; // 上周环比
                    let days7AgoRowsAverageData = {}; // 本周均值
                    let days7to14AgoRowsAverageData = {}; // 上周均值

                    if (_.get(days7AgoRows, 'length') && _.get(days7to14AgoRows, 'length')) {
                        // lastWeekRowData = calcDayCompareforRow(dateField, this.fields, todayRow, lastWeekRow);
                        lastWeekRowDataRatio = {};

                        this.fields.forEach(field => {
                            const fieldName = field.alias;
                            if (fieldName === dateField.alias) {
                                lastWeekRowDataRatio[fieldName] = '上周环比';
                                days7AgoRowsAverageData[fieldName] = '本周日均';
                                days7to14AgoRowsAverageData[fieldName] = '上周日均';
                            } else {
                                if (field.type === 'number' || field.type === 'int' || field.type === 'float') {
                                    // 前7天的数据
                                    let days7AgoRowsSum = days7AgoRows.reduce((acc, curr) => acc + curr[fieldName], 0);
                                    // 前7天到14天的数据
                                    let days7to14AgoRowsSum = days7to14AgoRows.reduce((acc, curr) => acc + curr[fieldName], 0);

                                    // lastWeekRowDataRatio[fieldName] = ((parseFloat(days7AgoRowsSum) / parseFloat(days7to14AgoRowsSum) - 1) * 100).toFixed(2) + '%';
                                    try {
                                        lastWeekRowDataRatio[fieldName] = ((parseFloat(days7AgoRowsSum) / days7AgoRows.length / (parseFloat(days7to14AgoRowsSum) / days7to14AgoRows.length) - 1) * 100).toFixed(2) + '%';
                                    } catch (e) {
                                        lastWeekRowDataRatio[fieldName] = 'N/A';
                                    }

                                    if (field.format) {
                                        days7AgoRowsAverageData[fieldName] = formatData(days7AgoRowsSum / days7AgoRows.length, field.format);
                                        days7to14AgoRowsAverageData[fieldName] = formatData(days7to14AgoRowsSum / days7to14AgoRows.length, field.format);
                                    } else {
                                        days7AgoRowsAverageData[fieldName] = (days7AgoRowsSum / days7AgoRows.length).toFixed(2);
                                        days7to14AgoRowsAverageData[fieldName] = (days7to14AgoRowsSum / days7to14AgoRows.length).toFixed(2);
                                    }
                                } else {
                                    lastWeekRowDataRatio[fieldName] = 'N/A';
                                    days7AgoRowsAverageData[fieldName] = 'N/A';
                                    days7to14AgoRowsAverageData[fieldName] = 'N/A';
                                }
                            }
                        });
                    } else {
                        lastWeekRowDataRatio = {};
                        lastWeekRowDataRatio[dateField.alias] = '上周环比';
                        this.fields.forEach(field => {
                            if (field.alias !== dateField.alias) {
                                lastWeekRowDataRatio[field.alias] = 'N/A';
                                days7AgoRowsAverageData[field.alias] = 'N/A';
                                days7to14AgoRowsAverageData[field.alias] = 'N/A';
                            }
                        });
                    }
                    let data = this._getFormatTalbeData(cloneTaleData);
                    if (!_.isEmpty(lastWeekRowDataRatio)) {
                        data.splice(1, 0, days7AgoRowsAverageData, days7to14AgoRowsAverageData, lastWeekRowDataRatio);

                        this.firstPageRowDif = this.firstPageRowDif + 3;
                    }
                    if (yesterdayRowData) {
                        data.splice(1, 0, yesterdayRowData);
                        this.firstPageRowDif++;
                    }
                    if (this.rowCountPerPage > data.length + this.firstPageRowDif) {
                        /**
                         *  @desc 如果数据行数加上同比环比少于一页，就全部展示了，不然展示条数会少两行
                         *  @link http://wf.vdian.net/browse/VIO-317?jql=project%20%3D%20VIO
                         */
                        this.firstPageRowDif = 0;
                    }
                    return data.slice(0, data.length - this.firstPageRowDif);
                }
            } else {
                // 水平方向
                todayColumn = this.fields[1];
                if (this.fields[2].alias === '昨日环比') {
                    // 翻页
                    this.fields.splice(2, 2);
                }

                const dateRegexp = this._isDateInString(todayColumn.alias).regexp;
                timestamp = getTimestamp(this.fields[1].alias.match(dateRegexp)[0]);
                yesterdayColumn = findColumnByTimestamp(this.fields.slice(2), timestamp - oneDayMillionSecond, dateRegexp);
                lastWeekColumn = findColumnByTimestamp(this.fields.slice(2), timestamp - oneDayMillionSecond * 7, dateRegexp);
                if (todayColumn) {
                    this.fields.splice(2, 0, {
                        alias: '上周同比'
                    });
                    this.fields.splice(2, 0, {
                        alias: '昨日环比'
                    });

                    cloneTaleData.forEach(item => {
                        item['昨日环比'] = calcDayCompareforColumn(item, todayColumn, yesterdayColumn);
                        item['上周同比'] = calcDayCompareforColumn(item, todayColumn, lastWeekColumn);
                    });

                    return this._getFormatTalbeData(cloneTaleData);
                }
            }

            return this._getFormatTalbeData(cloneTaleData);
        },
        _isDateType: isDateType,
        // 字符串中是否包含时间格式的字符串，简单判断即可
        _isDateInString(str) {
            if (str.match(/[12]\d\d\d-[01]\d-[0123]\d/)) {
                return {
                    pattern: 'YYYY-MM-DD',
                    precision: 'day',
                    regexp: /[12]\d\d\d-[01]\d-[0123]\d/
                };
            } else {
                return {
                    pattern: null,
                    precision: null,
                    regexp: null
                };
            }
        },
        //判断数据是否合理（有日期列）
        _getDateField() {
            //遍历所有列的元信息，查找type为date的列
            for (let i = 0; i < this.fields.length; i++) {
                if (this._isDateType(this.fields[i].type)) {
                    this.dateFieldDrection = 'vertical';
                    return _.cloneDeep(this.fields[i]);
                }
            }
            //选取第一列，和第一列的第一个数据
            let sampleDateData = this.rawTableData[0][this.fields[0].alias];
            if (isDate(sampleDateData).pattern) {
                this.dateFieldDrection = 'vertical';
                return _.cloneDeep(this.fields[0]);
            }

            if (this.hasPivotTable) {
                if (this._isDateInString(this.fields[1].alias)) {
                    //包含日期的格式
                    this.dateFieldDrection = 'horizontal';
                    return _.cloneDeep(this.fields[1]);
                }
            }
            //没找到日期列
        },
        _setSourceData() {
            const originData = _.cloneDeep(this.data[0]);
            let rawTableData = originData.chartData;
            const chartConfig = originData.chartConfig;
            const graphDetail = originData.graphDetail;

            let fields = chartConfig.group.concat(chartConfig.dimension);

            //处理moreGroupData的问题
            if (chartConfig.group.length > 1 && this.hasPivotTable) {
                // graphDetail.groupConfig.column
                let groupConfig: { [key: string]: any } = {};

                const checkInGroup = (array, groupArray) => {
                    array = _.cloneDeep(array);
                    for (let i = 0; i < array.length; i++) {
                        const name = array[i].name;
                        if (array[i].name === '_') {
                            // 特殊值处理
                        }
                        if (groupArray.every(group => group.name !== name)) {
                            array.splice(i, 1);
                            i++;
                        }
                    }
                    return array;
                };

                if (graphDetail.groupConfig) {
                    //去掉可能已删除的数据
                    graphDetail.groupConfig.row = checkInGroup(graphDetail.groupConfig.row, chartConfig.group);
                    graphDetail.groupConfig.column = checkInGroup(graphDetail.groupConfig.column, chartConfig.group);
                    groupConfig = {
                        rowHead: graphDetail.groupConfig.row,
                        columnHead: graphDetail.groupConfig.column
                    };

                    if (groupConfig.rowHead.length === 0 || groupConfig.columnHead.length === 0) {
                        groupConfig = {}; //初始化
                    }
                }

                groupConfig.isSql = this.editorType === 'sql';

                let { tableData, allField } = formatMoreGroupData(rawTableData, chartConfig.dimension, chartConfig.group, chartConfig.order, groupConfig);

                rawTableData = tableData;

                fields = allField;

                if (graphDetail.needTotal) {
                    fields = fields.concat(chartConfig.dimension);
                }
            }

            this.rawTableData = rawTableData;

            this.fields = fields;

            // 每次数据或者源数据改变时判断dateField
            if (graphDetail.compare) {
                this.dateFieldInTable = this._getDateField();
            }
        },
        _emitOrder(name) {
            if (!name || this.editorType !== 'topic') return;
            if (this.order.name === name) {
                let type = this.order.type;
                this.order.type = type ? (type === 'desc' ? 'asc' : undefined) : 'desc';
                this.$emit('order', this.order);
                this.orderEmit = true;
            } else {
                let fields = this.fields.filter(item => item.name === name);
                if (fields.length) {
                    this.order = _.cloneDeep(fields[0]);
                    this.order.type = 'desc';
                    this.order.field = this.order.name;
                    this.$emit('order', this.order);
                    this.orderEmit = true;
                }
            }
        },
        getFieldByName(name) {
            return _.find(this.fields, o => o.name == name);
        },
        nextPage(from) {
            // 向上翻页不多于最大页数
            // 页数+2意味着 首先pageNum是从0开始所以要加1
            // 其次当nextPage被点击的时候pageNum还是上一页的number所以当前要再加1再做判断
            // 综上页数需要+2再做判断
            if (from === 'pivot-table') {
                if (Math.ceil(this.pivotTableData.body.length / this.rowCountPerPage) >= this.pageNum + 2) {
                    this.pageNum++;
                    this._setTableData();
                }
            } else {
                if (Math.ceil(this.rawTableData.length / this.rowCountPerPage) >= this.pageNum + 2) {
                    this.pageNum++;
                    this._setTableData();
                }
            }
        },
        prevPage() {
            //向下翻页不小于0
            if (this.pageNum > 0) {
                this.pageNum--;
                this._setTableData();
            }
        },
        changePageNum(e) {
            this.gotoPage(Number(e.target.value) - 1);
        },
        gotoPage(num) {
            let total;
            if (!this.hasPivotTable) {
                total = Math.ceil(this.rawTableData.length / this.rowCountPerPage);
            } else {
                total = Math.ceil(this.pivotTableData.body.length / this.rowCountPerPage);
            }

            if (num <= 0) {
                this.pageNum = 0;
            } else if (num > 0 && num <= total) {
                this.pageNum = num;
            } else {
                this.pageNum = total - 1;
            }

            if (!this.hasPivotTable) this._setTableData();
        },
        _setTableData() {
            if (this.hasPivotTable) return;
            //得到需要显示的每页数据
            if (this.pageNum === 0) this.firstPageRowDif = 0;
            const tableData = this.rawTableData.slice(this.pageNum * this.rowCountPerPage - this.firstPageRowDif, (this.pageNum + 1) * this.rowCountPerPage - this.firstPageRowDif);
            this.temRawTableData = tableData;
            this.tableRenderData = this._comparedTableData(tableData);
            // 记录每行数据 每个属性的状态
            this.tableRenderDataMap = tableData.map(() => {
                const rowMap = {};
                this.fields.forEach(field => {
                    rowMap[field.alias] = {
                        isChanged: false,
                        // background-color:transparent 透明背景色
                        otherHtmlTemplate: `<p style="min-height: 27px;display:flex;align-items: center;padding: 0 0.75rem;color:#727479; background-color:transparent;">currentValue</p>`
                    };
                });
                return rowMap;
            });
        },
        _getFormatTalbeData(tableData, fields) {
            fields = fields || this.fields;
            const needFormatField = fields.filter(item => item.format);
            return tableData.map(data => {
                needFormatField.forEach(e => {
                    data[e.alias] = formatData(data[e.alias], e.format);
                });
                return data;
            });
        },
        _setRowCount() {
            const TABLE_ROW_HEIGHT = 29;
            const TABLE_HEADER_HEIGHT = 31;
            const MARGIN_TOP = 20;
            let tableHeight = this.chartHeight - 30 - TABLE_HEADER_HEIGHT - MARGIN_TOP;
            this.rowCountPerPage = Math.floor(tableHeight / TABLE_ROW_HEIGHT);
            // if (this.canDataValid()) {
            //     this.rowCountPerPage = this.rowCountPerPage - 2;
            // }

            if (this.rowCountPerPage < 1) {
                this.rowCountPerPage = 1;
                this.showScrollY = true;
            } else {
                this.showScrollY = false;
            }
        },
        _onHeightChange() {
            this._setRowCount();
            this._setTableData();
        },

        getComparedClass(row, field: Field) {
            if (!this.comparedDataValid) return null;
            const dateField = this.dateFieldInTable;
            const classList = [];
            if (dateField) {
                if (
                    (this.dateFieldDrection === 'vertical' && ['昨日环比', '上周环比', '本周日均', '上周日均'].includes(row[dateField.alias || dateField.name])) ||
                    (this.dateFieldDrection === 'horizontal' && ['昨日环比', '上周环比', '本周日均', '上周日均'].includes(field.alias))
                ) {
                    classList.push('compared-row');
                }

                if (
                    (this.dateFieldDrection === 'vertical' && ['昨日环比', '上周环比'].includes(row[dateField.alias || dateField.name])) ||
                    (this.dateFieldDrection === 'horizontal' && ['昨日环比', '上周环比'].includes(field.alias))
                ) {
                    if (parseFloat(row[field.alias]) >= 0) {
                        classList.push('positive');
                    } else if (parseFloat(row[field.alias]) < 0) {
                        classList.push('negative');
                    }
                }
            }
            return classList;
        },

        refreshChart() {
            this.$emit('renderStart');
            this.clearChart();
            this._initChart();
            this.$emit('renderEnd');
        },
        clearChart() {
            this.rawTableData = [];
        },
        clearOrder() {
            this.order = {
                field: undefined,
                type: undefined
            };
        }
    },
    watch: {
        data: {
            deep: true,
            handler() {
                if (this.orderEmit) {
                    this.orderEmit = false;
                } else {
                    this.clearOrder();
                }

                this.refreshChart();
            }
        },
        chartHeight() {
            // 优化性能设置节流
            this._onHeightChangeBind();
        }
    }
};
</script>

<style lang="less">
@import './charts.less';

.flex-column {
    width: 100%;
    box-sizing: border-box;
    padding: 0 10px;
    margin-top: 10px;
}

.compared-row {
    font-weight: 500;

    &.positive {
        color: #f44336;
    }

    &.negative {
        color: #4caf50;
    }
}

.table-pagination {
    height: 30px;

    i {
        color: #888;
    }

    .pageInput {
        width: 35px;
        height: 20px;
        color: #666;
        text-align: center;
        border: 1px solid #888;
        border-radius: 3px;
    }

    input[type='number']::-webkit-inner-spin-button,
    input[type='number']::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .pd {
        padding-left: 6px;
    }
}

.table-scroll-y {
    overflow-y: scroll;
}
</style>
