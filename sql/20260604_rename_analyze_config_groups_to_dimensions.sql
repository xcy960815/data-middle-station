-- Rename analyze_config grouping-field column from groups to dimensions,
-- then replace stored JSON/text values that contain the exact JSON token "groups".
-- This is a hard rename for the analysis "分组/维度" field.
-- It intentionally does not replace SQL text such as GROUP BY or dataset fieldType = 'dimension'.

DELIMITER $$

DROP PROCEDURE IF EXISTS rename_analyze_config_groups_to_dimensions $$

CREATE PROCEDURE rename_analyze_config_groups_to_dimensions()
BEGIN
  DECLARE old_column_count INT DEFAULT 0;
  DECLARE new_column_count INT DEFAULT 0;

  SELECT COUNT(*)
    INTO old_column_count
    FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'analyze_config'
     AND column_name = 'groups';

  SELECT COUNT(*)
    INTO new_column_count
    FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'analyze_config'
     AND column_name = 'dimensions';

  IF old_column_count = 1 AND new_column_count = 0 THEN
    ALTER TABLE `analyze_config`
      CHANGE COLUMN `groups` `dimensions` JSON DEFAULT NULL COMMENT '分组/维度配置(JSON格式)';
  ELSEIF old_column_count = 0 AND new_column_count = 1 THEN
    ALTER TABLE `analyze_config`
      MODIFY COLUMN `dimensions` JSON DEFAULT NULL COMMENT '分组/维度配置(JSON格式)';
  ELSEIF old_column_count = 1 AND new_column_count = 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'analyze_config has both groups and dimensions columns; clean one manually before running this migration';
  ELSE
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'analyze_config.groups column not found';
  END IF;
END $$

CALL rename_analyze_config_groups_to_dimensions() $$

DROP PROCEDURE IF EXISTS rename_analyze_config_groups_to_dimensions $$

DELIMITER ;

DELIMITER $$

DROP PROCEDURE IF EXISTS replace_groups_json_values_to_dimensions $$

CREATE PROCEDURE replace_groups_json_values_to_dimensions()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE target_table_name VARCHAR(255);
  DECLARE target_column_name VARCHAR(255);
  DECLARE update_sql TEXT;

  DECLARE column_cursor CURSOR FOR
    SELECT table_name, column_name
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND data_type IN (
         'char',
         'varchar',
         'tinytext',
         'text',
         'mediumtext',
         'longtext',
         'json'
       );

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN column_cursor;

  replace_loop: LOOP
    FETCH column_cursor INTO target_table_name, target_column_name;
    IF done = 1 THEN
      LEAVE replace_loop;
    END IF;

    SET update_sql = CONCAT(
      'UPDATE `',
      REPLACE(target_table_name, '`', '``'),
      '` SET `',
      REPLACE(target_column_name, '`', '``'),
      '` = REPLACE(CAST(`',
      REPLACE(target_column_name, '`', '``'),
      '` AS CHAR), ''"groups"'', ''"dimensions"'')',
      ' WHERE `',
      REPLACE(target_column_name, '`', '``'),
      '` IS NOT NULL',
      ' AND CAST(`',
      REPLACE(target_column_name, '`', '``'),
      '` AS CHAR) LIKE ''%"groups"%'''
    );

    PREPARE stmt FROM update_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END LOOP;

  CLOSE column_cursor;
END $$

CALL replace_groups_json_values_to_dimensions() $$

DROP PROCEDURE IF EXISTS replace_groups_json_values_to_dimensions $$

DELIMITER ;
