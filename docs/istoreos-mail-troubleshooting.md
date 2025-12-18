# istoreOS 容器 SMTP 连接故障排查记录

## 背景

- **服务镜像**: `xcy960815/data-middle-station:1.0`
- **运行环境**: istoreOS 22.03.7（OpenWrt）
- **问题现象**: 容器发送邮件时报错 `connect ECONNREFUSED 220.197.33.205:465`
- **期望目标**: 在保持 Docker 默认 bridge 网络的前提下，容器可访问外部 SMTPS 服务器

## 排查过程

### 1. 确认主机网络正常

在 istoreOS 宿主机执行 `nc -vz 220.197.33.205 465`，结果 `open`，排除出口链路阻断。

### 2. 容器内测试失败

`docker exec dms-container nc -vz 220.197.33.205 465` 得到 `Connection refused`，说明问题出在容器网络路径上。

### 3. 比对不同网络模式

使用 `docker run --network=host` 启动临时容器能成功发信，进一步收敛到 Docker bridge 网络或宿主机防火墙。

### 4. 检查 Docker 网络

- `docker network inspect dms-service_dms-service-network` 显示业务容器位于自定义 bridge（网段 `172.18.0.0/16`，接口 `br-4e4eb4db3fbd`）
- `iptables -L FORWARD` 中缺少对该桥接口的放行，同时默认 `com.docker.network.bridge.enable_ip_masquerade=false`，导致 NAT 不生效

### 5. 验证临时规则

手动执行以下命令后 `nc` 成功，证明阻断点确实在防火墙/NAT：

```bash
iptables -I FORWARD 1 -i br-4e4eb4db3fbd -p tcp --dport 465 -j ACCEPT
iptables -I FORWARD 1 -o pppoe-wan -p tcp --sport 465 -j ACCEPT
iptables -t nat -I POSTROUTING 1 -s 172.18.0.0/16 -o pppoe-wan -j MASQUERADE
```

## 最终修复

将上述三条规则写入 `/etc/firewall.user`，以保证系统启动或重启防火墙后自动恢复：

```bash
cat >> /etc/firewall.user <<'EOF'
iptables -I FORWARD 1 -i br-4e4eb4db3fbd -p tcp --dport 465 -j ACCEPT
iptables -I FORWARD 1 -o pppoe-wan -p tcp --sport 465 -j ACCEPT
iptables -t nat -I POSTROUTING 1 -s 172.18.0.0/16 -o pppoe-wan -j MASQUERADE
EOF
service firewall restart
```

> **注意**: 若存在多个 WAN 接口（如 `eth0`），需为每个接口复制第二、三条命令并替换 `pppoe-wan`。

重启防火墙后，在容器内再次执行 `nc -vz 220.197.33.205 465` 与实际邮件发送，确认成功。

## 结论

- **根因**: istoreOS/OpenWrt 默认防火墙未允许自定义 Docker bridge (`br-4e4eb4db3fbd`, `172.18.0.0/16`) 出口访问 465，且缺少 NAT，导致容器到外网 SMTPS 流量被拒绝
- **修复方案**: 针对该 bridge 接口添加 FORWARD 放行与 MASQUERADE 规则，并持久化到 `/etc/firewall.user`
- **修复结果**: 恢复 `docker-compose` 的 bridge 网络模式，容器发送邮件与主机一致，不再需要 `--network=host`
