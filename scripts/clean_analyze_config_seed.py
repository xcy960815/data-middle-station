#!/usr/bin/env python3
"""清洗 data_middle_station.sql 中 analyze_config / analyze 种子数据。"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL_PATH = ROOT / 'sql' / 'data_middle_station.sql'

MAPPING = {
    'operation_analysis': (9001, '运营分析数据集'),
    'inventory_turnover': (9002, '库存周转数据集'),
    'campaign_conversion': (9003, '营销转化数据集'),
    'city_temperature': (9004, '城市气温数据集'),
}

OLD_COLS = "(`id`, `analyze_id`, `version_no`, `data_source`, `measures`"
NEW_COLS = "(`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`"

TABLE_SOURCE = """  `dataset_id` bigint unsigned DEFAULT NULL COMMENT '数据集ID',
  `data_source` varchar(100) DEFAULT NULL COMMENT '已废弃：原物理表名，仅兼容历史数据',"""
TABLE_TARGET = """  `dataset_id` bigint unsigned DEFAULT NULL COMMENT '数据集ID',"""


def normalize_common_chart_config(raw: str, dataset_name: str) -> str:
    obj = json.loads(raw)
    obj.pop('datasetId', None)
    obj.pop('dataSourceMode', None)
    obj['datasetName'] = dataset_name
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'))


def process_analyze_config_line(line):
    if OLD_COLS not in line:
        return line, None

    m = re.search(r"VALUES \((\d+), (\d+), (\d+), '([^']*)',", line)
    if not m:
        return None, None

    config_id, analyze_id, version_no, data_source = m.groups()
    mapped = MAPPING.get(data_source)
    if not mapped:
        return None, None

    dataset_id, dataset_name = mapped
    line = line.replace(OLD_COLS, NEW_COLS, 1)
    line = re.sub(
        r"VALUES \((\d+), (\d+), (\d+), '([^']*)',",
        f"VALUES ({config_id}, {analyze_id}, {version_no}, {dataset_id},",
        line,
        count=1,
    )

    def replace_common(match):
        inner = match.group(1).replace('\\"', '"')
        normalized = normalize_common_chart_config(inner, dataset_name)
        return "'" + normalized.replace("'", "\\'").replace('"', '\\"') + "'"

    line = re.sub(r"'(\{\\\"limit\\\"[^']*)'", replace_common, line, count=1)
    return line, int(analyze_id)


def process_analyze_line(line, valid_configs):
    m = re.search(
        r"VALUES \((\d+), '([^']*)', (\d+), '([^']*)', '([^']*)', '([^']*)', '([^']*)', (NULL|\d+), '([^']*)', (\d+)\);",
        line,
    )
    if not m:
        return line

    analyze_id = int(m.group(1))
    configs = valid_configs.get(analyze_id, [])
    if not configs:
        current_config_id = 'NULL'
        is_deleted = '1'
    else:
        latest = max(configs, key=lambda item: (item[1], item[0]))
        current_config_id = str(latest[0])
        is_deleted = m.group(10)

    return (
        f"INSERT INTO `analyze` (`id`, `analyze_name`, `view_count`, `create_time`, `created_by`, "
        f"`update_time`, `updated_by`, `current_config_id`, `analyze_desc`, `is_deleted`) VALUES "
        f"({m.group(1)}, '{m.group(2)}', {m.group(3)}, '{m.group(4)}', '{m.group(5)}', '{m.group(6)}', "
        f"'{m.group(7)}', {current_config_id}, '{m.group(9)}', {is_deleted});"
    )


def collect_valid_configs(lines):
    in_config_records = False
    valid_configs = {}
    kept = skipped = 0
    processed_lines = {}

    for idx, line in enumerate(lines):
        if line.strip() == '-- Records of analyze_config':
            in_config_records = True
            continue
        if in_config_records and line.strip().startswith('-- Records of '):
            in_config_records = False

        if in_config_records and line.startswith('INSERT INTO `analyze_config`'):
            processed, _ = process_analyze_config_line(line)
            if processed is None:
                skipped += 1
                processed_lines[idx] = None
                continue
            m = re.search(r"VALUES \((\d+), (\d+), (\d+), (\d+),", processed)
            if m:
                config_id, aid, version_no, _ = map(int, m.groups())
                valid_configs.setdefault(aid, []).append((config_id, version_no, aid))
            processed_lines[idx] = processed
            kept += 1

    return valid_configs, processed_lines, kept, skipped


def main():
    text = SQL_PATH.read_text()

    if TABLE_SOURCE in text:
        text = text.replace(TABLE_SOURCE, TABLE_TARGET)

    lines = text.splitlines()
    valid_configs, processed_lines, kept, skipped = collect_valid_configs(lines)
    out = []

    for idx, line in enumerate(lines):
        if idx in processed_lines:
            processed = processed_lines[idx]
            if processed is not None:
                out.append(processed)
            continue

        if line.startswith('INSERT INTO `analyze`'):
            line = process_analyze_line(line, valid_configs)

        out.append(line)

    SQL_PATH.write_text('\n'.join(out) + ('\n' if text.endswith('\n') else ''))
    print(f'analyze_config kept={kept}, skipped={skipped}')
    print('valid analyze ids:', sorted(valid_configs.keys()))


if __name__ == '__main__':
    main()
