-- Replace stored JSON/text values that contain the exact JSON token "groups".
-- Use this when the analyze_config column has already been renamed separately.
-- It intentionally matches only '"groups"', so SQL text such as GROUP BY is not changed.

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
