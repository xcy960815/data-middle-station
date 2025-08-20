DROP TABLE IF EXISTS `city_temperature`;
CREATE TABLE `city_temperature` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `month` VARCHAR(3) NOT NULL COMMENT '月份(英文缩写)',
  `city` VARCHAR(32) NOT NULL COMMENT '城市名称',
  `temperature` DECIMAL(4,1) NOT NULL COMMENT '月均气温 (°C)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_month_city` (`month`, `city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='城市月度气温表';

INSERT INTO `city_temperature` (`month`, `city`, `temperature`) VALUES
('Jan', 'Tokyo', 7.0),
('Jan', 'London', 3.9),
('Feb', 'Tokyo', 6.9),
('Feb', 'London', 4.2),
('Mar', 'Tokyo', 9.5),
('Mar', 'London', 5.7),
('Apr', 'Tokyo', 14.5),
('Apr', 'London', 8.5),
('May', 'Tokyo', 18.4),
('May', 'London', 11.9),
('Jun', 'Tokyo', 21.5),
('Jun', 'London', 15.2),
('Jul', 'Tokyo', 25.2),
('Jul', 'London', 17.0),
('Aug', 'Tokyo', 26.5),
('Aug', 'London', 16.6),
('Sep', 'Tokyo', 23.3),
('Sep', 'London', 14.2),
('Oct', 'Tokyo', 18.3),
('Oct', 'London', 10.3),
('Nov', 'Tokyo', 13.9),
('Nov', 'London', 6.6),
('Dec', 'Tokyo', 9.6),
('Dec', 'London', 4.8);
