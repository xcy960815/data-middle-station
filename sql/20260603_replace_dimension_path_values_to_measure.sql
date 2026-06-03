-- Replace stored string values from dimension/ to measure/.
-- This updates text-like and JSON columns in the current database.
-- It intentionally matches only 'dimension/' so dataset fieldType = 'dimension' is not changed.

DELIMITER $$

DROP PROCEDURE IF EXISTS replace_dimension_path_values_to_measure $$

CREATE PROCEDURE replace_dimension_path_values_to_measure()
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
      '` AS CHAR), ''dimension/'', ''measure/'')',
      ' WHERE `',
      REPLACE(target_column_name, '`', '``'),
      '` IS NOT NULL',
      ' AND CAST(`',
      REPLACE(target_column_name, '`', '``'),
      '` AS CHAR) LIKE ''%dimension/%'''
    );

    PREPARE stmt FROM update_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END LOOP;

  CLOSE column_cursor;
END $$

CALL replace_dimension_path_values_to_measure() $$

DROP PROCEDURE IF EXISTS replace_dimension_path_values_to_measure $$

DELIMITER ;
