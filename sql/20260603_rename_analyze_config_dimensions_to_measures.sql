-- Rename analyze_config value-field column from dimensions to measures.
-- This is a hard rename for the analysis "值/指标" field.
-- Dataset fieldType values such as 'dimension' are not part of this migration.

DELIMITER $$

DROP PROCEDURE IF EXISTS rename_analyze_config_dimensions_to_measures $$

CREATE PROCEDURE rename_analyze_config_dimensions_to_measures()
BEGIN
  DECLARE old_column_count INT DEFAULT 0;
  DECLARE new_column_count INT DEFAULT 0;

  SELECT COUNT(*)
    INTO old_column_count
    FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'analyze_config'
     AND column_name = 'dimensions';

  SELECT COUNT(*)
    INTO new_column_count
    FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'analyze_config'
     AND column_name = 'measures';

  IF old_column_count = 1 AND new_column_count = 0 THEN
    ALTER TABLE `analyze_config`
      CHANGE COLUMN `dimensions` `measures` JSON DEFAULT NULL COMMENT '值/指标配置(JSON格式)';
  ELSEIF old_column_count = 0 AND new_column_count = 1 THEN
    ALTER TABLE `analyze_config`
      MODIFY COLUMN `measures` JSON DEFAULT NULL COMMENT '值/指标配置(JSON格式)';
  ELSEIF old_column_count = 1 AND new_column_count = 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'analyze_config has both dimensions and measures columns; clean one manually before running this migration';
  ELSE
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'analyze_config.dimensions column not found';
  END IF;
END $$

CALL rename_analyze_config_dimensions_to_measures() $$

DROP PROCEDURE IF EXISTS rename_analyze_config_dimensions_to_measures $$

DELIMITER ;
