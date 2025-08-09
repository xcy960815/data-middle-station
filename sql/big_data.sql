-- big_data.sql
-- 说明：创建示例表 big_data 并一次性生成 10000 条测试数据
-- 生成方式：使用 0..9 的笛卡尔积拼接出 1..10000 的序列，避免递归 CTE 深度限制

DROP TABLE IF EXISTS `big_data`;
CREATE TABLE `big_data` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(100) NOT NULL COMMENT '姓名',
  `age` INT NOT NULL COMMENT '年龄',
  `gender` VARCHAR(10) NOT NULL COMMENT '性别',
  `country` VARCHAR(50) NOT NULL COMMENT '国家',
  `city` VARCHAR(50) NOT NULL COMMENT '城市',
  `state` VARCHAR(10) NOT NULL COMMENT '州',
  `zipcode` VARCHAR(10) NOT NULL COMMENT '邮编',
  `address` VARCHAR(255) NOT NULL COMMENT '地址',
  `phone` VARCHAR(20) NOT NULL COMMENT '电话',
  `mobile` VARCHAR(20) NOT NULL COMMENT '手机',
  `company` VARCHAR(100) NOT NULL COMMENT '公司',
  `department` VARCHAR(50) NOT NULL COMMENT '部门',
  `position` VARCHAR(50) NOT NULL COMMENT '职位',
  `salary` VARCHAR(20) NOT NULL COMMENT '薪资',
  `experience` VARCHAR(20) NOT NULL COMMENT '经验',
  `education` VARCHAR(50) NOT NULL COMMENT '教育',
  `skills` VARCHAR(150) NOT NULL COMMENT '技能',
  `notes` VARCHAR(255) NOT NULL COMMENT '备注',
  `email` VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 兼容 MySQL 5.7/8：改用临时 0..9 数字表生成序列（避免 WITH CTE）
INSERT INTO `big_data` (
  `id`, `name`, `age`, `gender`, `country`, `city`, `state`, `zipcode`, `address`,
  `phone`, `mobile`, `company`, `department`, `position`, `salary`, `experience`,
  `education`, `skills`, `notes`, `email`
)
SELECT
  i AS id,
  CONCAT('User ', i) AS name,
  18 + ((i * 7) % 40) AS age,
  ELT(((i * 3) % 3) + 1, 'Male', 'Female', 'Other') AS gender,
  ELT(((i * 3) % 8) + 1, 'China','USA','UK','Germany','France','Japan','Canada','Australia') AS country,
  ELT(((i * 5) % 9) + 1, 'Beijing','Shanghai','New York','London','Berlin','Paris','Tokyo','Toronto','Sydney') AS city,
  ELT(((i * 7) % 10) + 1, 'CA','NY','TX','FL','WA','IL','PA','OH','GA','NC') AS state,
  LPAD(CAST(10000 + ((i * 123) % 90000) AS CHAR), 5, '0') AS zipcode,
  CONCAT(i, ' Main Street, Apt ', ((i % 50) + 1)) AS address,
  CONCAT('+1-555-', LPAD(((1000 + i) % 10000), 4, '0')) AS phone,
  CONCAT('+1-666-', LPAD(((2000 + i) % 10000), 4, '0')) AS mobile,
  ELT(((i * 11) % 8) + 1, 'TechCorp','DataSoft','CloudInc','WebSolutions','AppDev','SystemsLtd','CodeWorks','DigitalPro') AS company,
  ELT(((i * 13) % 8) + 1, 'Engineering','Marketing','Sales','HR','Finance','Operations','Support','Design') AS department,
  ELT(((i * 17) % 8) + 1, 'Developer','Manager','Analyst','Designer','Consultant','Specialist','Coordinator','Director') AS position,
  CONCAT('$', FORMAT(30000 + ((i * 1000) % 120000), 0)) AS salary,
  CONCAT(((i % 20) + 1), ' years') AS experience,
  ELT(((i * 19) % 6) + 1, 'Bachelor','Master','PhD','Associate','High School','Certificate') AS education,
  ELT(((i * 23) % 8) + 1,
      'JavaScript, React','Python, Django','Java, Spring','C#, .NET','PHP, Laravel','Go, Gin','Ruby, Rails','Node.js, Express') AS skills,
  CONCAT('Additional notes for user ', i, '. Lorem ipsum dolor sit amet.') AS notes,
  CONCAT('user', i, '@', ELT(((i * 29) % 5) + 1, 'gmail.com','yahoo.com','outlook.com','company.com','example.org')) AS email
FROM (
  SELECT (a.n + b.n * 10 + c.n * 100 + d.n * 1000) + 1 AS i
  FROM 
    (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
  CROSS JOIN 
    (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b
  CROSS JOIN 
    (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c
  CROSS JOIN 
    (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
     UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d
) t
WHERE i BETWEEN 1 AND 10000;

-- 可选：索引
CREATE INDEX idx_big_data_email ON `big_data` (`email`);
CREATE INDEX idx_big_data_country_city ON `big_data` (`country`, `city`);

