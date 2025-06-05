// 配置pm2
module.exports = {
  apps: [
    {
      name: 'DataMiddleStation',
      exec_mode: 'fork', // 自家主机window cluster_mode 模式下启动失败
      instances: '1',
      script: '.output/server/index.mjs',
      args: '', // 传递给脚本的参数
      watch: true, // 开启监听文件变动重启
      ignore_watch: ['node_modules', 'public', 'logs'], // 不用监听的文件
      autorestart: true, // 默认为 true, 发生异常的情况下自动重启
      max_memory_restart: '1G',
      error_file: './logs/pm2/error.log', // 错误日志文件
      out_file: './logs/pm2/out.log', // 正常日志文件
      startup_file: './logs/pm2/startup.log', // 启动日志文件
      merge_logs: true, // 设置追加日志而不是新建日志
      log_date_format: 'YYYY-MM-DD HH:mm:ss', // 指定日志文件的时间格式
      min_uptime: '60s', // 应用运行少于时间被认为是异常启动
      max_restarts: 30, // 最大异常重启次数
      restart_delay: 60, // 异常重启情况下，延时重启时间
      env: {
        // 环境参数，当前指定为开发环境
        NODE_ENV: 'dev', // 使用dev模式 pm2 start ecosystem.config.js --env dev
        PORT: '12581',
        MYSQL_HOST: 'localhost',
        MYSQL_PORT: '3306',
        MYSQL_USER: 'root',
        MYSQL_PASSWORD: '123456',
        MYSQL_DATABASE: 'data_middle_station'
      },
      env_production: {
        // 环境参数,当前指定为生产环境
        NODE_ENV: 'prod', // 使用production模式 pm2 start ecosystem.config.js --env prod
        PORT: '12581',
        MYSQL_HOST: 'localhost',
        MYSQL_PORT: '3306',
        MYSQL_USER: 'root',
        MYSQL_PASSWORD: '123456',
        MYSQL_DATABASE: 'data_middle_station'
      },
      env_pre: {
        // 环境参数,当前为测试环境
        NODE_ENV: 'pre', // 使用pre模式 pm2 start ecosystem.config.js --env pre
        PORT: '12581',
        MYSQL_HOST: 'localhost',
        MYSQL_PORT: '3306',
        MYSQL_USER: 'root',
        MYSQL_PASSWORD: '123456',
        MYSQL_DATABASE: 'data_middle_station'
      },
      env_daily: {
        // 环境参数,当前为日常环境
        NODE_ENV: 'daily', // 使用daily模式 pm2 start ecosystem.config.js --env daily
        PORT: '12581',
        MYSQL_HOST: 'localhost',
        MYSQL_PORT: '3306',
        MYSQL_USER: 'root',
        MYSQL_PASSWORD: '123456',
        MYSQL_DATABASE: 'data_middle_station'
      }
    }
  ]
}
