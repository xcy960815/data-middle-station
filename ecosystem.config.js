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
      // out_file: './logs/pm2/out.log', // 正常日志文件
      startup_file: './logs/pm2/startup.log', // 启动日志文件
      merge_logs: true, // 设置追加日志而不是新建日志
      log_date_format: 'YYYY-MM-DD HH:mm:ss', // 指定日志文件的时间格式
      min_uptime: '60s', // 应用运行少于时间被认为是异常启动
      max_restarts: 30, // 最大异常重启次数
      restart_delay: 60, // 异常重启情况下，延时重启时间
      env: {
        // 默认环境参数
        NODE_ENV: 'development',
        PORT: '3000',
      },
      env_daily: {
        // 日常环境参数
        NODE_ENV: 'daily',
        PORT: '12581',
      },
      env_pre: {
        // 预发环境参数
        NODE_ENV: 'pre',
        PORT: '12582',
      },
      env_prod: {
        // 生产环境参数
        NODE_ENV: 'prod',
        PORT: '12583',
      },
    },
  ],
}
