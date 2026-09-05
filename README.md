# Douban Kindle Screensaver / Kindle 豆瓣秀

把豆瓣读书里的「在读 / 读过 / 想读」自动生成一张 Kindle 屏保，并通过 GitHub Actions + GitHub Pages 定时更新。

这个项目的起点，是已经消失的老豆瓣功能「豆瓣秀」：以前可以把自己的豆瓣动态放在个人博客首页。我一直很喜欢它。现在换一种方式，把它“复活”到了 Kindle 上。

> 把已经消失的「豆瓣秀」，从博客首页搬到 Kindle 屏幕上。

当前基础版式按 **Kindle Oasis 2 / 3（1264 × 1680）** 设计，也支持将最终图片缩放为多款常见小屏 Kindle 的分辨率。

## 效果与内容

屏保显示最近半年的：

- 正在读：1 本大图、2 本双列、3 本三列；超过 3 本时显示最近 3 本并提示余数
- 最近读过：4 本，2×2 封面
- 想读：最近 5 本
- 半年阅读统计与当前日期

封面会转为灰度并增强对比度，适合 Kindle 墨水屏。

## 工作流程

```text
豆瓣公开读书数据
        ↓
@marvae24/douban-cli
        ↓
resolve-profile.js（自动取得豆瓣昵称）
        ↓
render.js（Oasis 2 / 3 基础版式）
        ↓
resize-output.js（按目标 Kindle 分辨率输出）
        ↓
bg_ss00.png
        ↓
GitHub Actions（每天两次）
        ↓
GitHub Pages
        ↓
Kindle Online Screensaver
        ↓
Screensaver Hack
```

GitHub 负责生成图片，Online Screensaver 只负责下载，Screensaver Hack 负责显示。

## Fork 后怎么用

### 1. Fork 仓库

Fork 到自己的 GitHub 账号。

### 2. 修改 `config.json`

`doubanUserId` 是唯一必须修改的项目。默认保留 Oasis 2 / 3 基础图，同时生成 KPW3 / KPW4 专用图：

```json
{
  "doubanUserId": "1105344",
  "displayName": "",
  "pageTitle": "",
  "subtitle": "近 半 年 阅 读",
  "screenWidth": 1264,
  "screenHeight": 1680,
  "deviceOutputs": [
    {
      "file": "bg_kpw3.png",
      "width": 1072,
      "height": 1448
    }
  ]
}
```

例如豆瓣主页是：

```text
https://www.douban.com/people/12345678/
```

则改为：

```json
"doubanUserId": "12345678"
```

`displayName` 和 `pageTitle` 默认保持空白即可。GitHub Actions 会根据 `doubanUserId` 自动访问公开的豆瓣读书主页并取得昵称：

- 屏保顶部自动显示该豆瓣昵称；较短的中文昵称会自动排成类似 `闲 作 草 的` 的形式
- GitHub Pages 页面标题自动生成成“昵称的豆瓣秀”
- 如果你希望自定义显示方式，可以手工填写 `displayName` 或 `pageTitle` 覆盖自动值
- `subtitle` 是副标题，可自行修改

因此正常使用路径就是：

```text
Fork → 改 doubanUserId → 确认目标设备输出 → 开启 Pages → Run workflow
```

本项目只读取豆瓣公开页面，不需要账号密码、Cookie 或 Token。因此「在读 / 读过 / 想读」需要能被公开访问。

昵称同样从公开的豆瓣读书主页自动读取。如果豆瓣临时阻止访问或页面结构变化导致昵称解析失败，脚本会退回显示豆瓣 ID / 通用“豆瓣秀”，**不会继续显示仓库作者的昵称**。

### 3. 选择 Kindle 屏幕尺寸

默认配置：

```json
"screenWidth": 1264,
"screenHeight": 1680
```

对应 Kindle Oasis 2 / 3，也与 2024 款 Kindle Paperwhite（12th Gen，常称 KPW6）相同。

常见机型可参考：

| Kindle 型号 | 屏幕分辨率 |
| --- | --- |
| Kindle Voyage（KV） | 1072 × 1448 |
| Kindle Oasis 1 | 1072 × 1448 |
| Kindle Paperwhite 3 | 1072 × 1448 |
| Kindle Paperwhite 4 | 1072 × 1448 |
| Kindle Paperwhite 5（11th Gen） | 1236 × 1648 |
| Kindle Paperwhite 6（12th Gen，2024） | 1264 × 1680 |
| Kindle Oasis 2 / 3 | 1264 × 1680 |

如果只服务一台 Paperwhite 5，可以把基础输出改为：

```json
"screenWidth": 1236,
"screenHeight": 1648
```

如果需要同时服务多台不同分辨率的 Kindle，建议保留基础输出，并在 `deviceOutputs` 中继续增加文件名、宽度和高度。项目仍以 Oasis 2 / 3 的 1264 × 1680 版式作为基础画布，再生成各设备专用图片。

不要让不同分辨率的设备共用同一个最终 PNG。即使纵横比接近，Screensaver Hack 仍以接收与屏幕完全匹配的图片最稳妥。

> 目前没有为大屏 Kindle（例如 Scribe）设计单独版式，也不建议仅靠缩放使用本项目。

如果你的设备不是以上型号，请先确认其实际屏幕分辨率，再填写 `screenWidth` / `screenHeight`。

### 4. 开启 GitHub Pages

进入：

```text
Settings → Pages
```

Source 选择：

```text
GitHub Actions
```

然后到：

```text
Actions → Update Douban Kindle Screensaver → Run workflow
```

成功后图片地址通常是：

```text
https://<GitHub用户名>.github.io/<仓库名>/bg_ss00.png
```

本仓库示例：

```text
https://hishucheng.github.io/douban-kindle-screensaver/bg_ss00.png
```

本仓库还会同时发布适配 Paperwhite 3 / 4 的 1072 × 1448 灰度图：

```text
https://hishucheng.github.io/douban-kindle-screensaver/bg_kpw3.png
```

Oasis 2 / 3 继续使用 `bg_ss00.png`，KPW3 / KPW4 使用 `bg_kpw3.png`，避免两种分辨率共用同一文件。

## 自动更新时间

GitHub Actions 默认北京时间每天两次：

```text
06:17
18:17
```

也可以随时手动运行 workflow。

## Kindle 端

需要 Kindle 已越狱，并安装：

- KUAL
- Screensaver Hack（linkss）
- Online Screensaver

本项目实机测试环境：

```text
Kindle Oasis 2 / Firmware 5.16.2.1.1 / 1264 × 1680
Kindle Paperwhite 3 / Firmware 5.16.2.1.1 / 1072 × 1448
```

Paperwhite 3 已完成 Kindle 端实机部署；Paperwhite 4 与它分辨率相同，但本项目的在线屏保链路尚未在 KPW4 上单独实测。其他机型的分辨率输出可通过配置生成，实际 Kindle 端行为仍可能因型号、固件和所用 Screensaver Hack 版本而有差异。

### Online Screensaver 关键配置

把自己的 Pages 图片地址填入 `config.sh`。Oasis 2 / 3 使用：

```sh
SCHEDULE="00:00-24:00=720"
IMAGE_URI="https://<username>.github.io/<repo>/bg_ss00.png"
SCREENSAVERFOLDER=/mnt/us/linkss/screensavers/
SCREENSAVERFILE=$SCREENSAVERFOLDER/bg_ss00.png
DISABLE_WIFI=0
NETWORK_TIMEOUT=60
RTC=1
```

KPW3 / KPW4 使用专用输出：

```sh
IMAGE_URI="https://<username>.github.io/<repo>/bg_kpw3.png"
SCREENSAVERFILE=/mnt/us/linkss/screensavers/bg_ss00.png
LOGFILE=/mnt/us/onlinescreensaver.log
```

远端文件名按设备区分，本地仍保存为 `bg_ss00.png`，供 Screensaver Hack 显示。

`720` 分钟约等于每 12 小时更新一次。

在 Windows 上编辑 `.sh` 文件时，请用 Notepad++、VS Code 等，并保存为 **UTF-8 + LF**，避免 CRLF 引发 shell 问题。

## Oasis 2：关闭 Online Screensaver 的强制刷屏

在 Oasis 2 上，Online Screensaver 自带的 `eips` 即时刷屏会把图片错误拉伸。

因此建议让 Online Screensaver **只负责下载**，显示交给 Screensaver Hack。

编辑：

```text
/mnt/us/extensions/onlinescreensaver/bin/update.sh
```

把类似两行注释掉：

```sh
# eips -f -g $SCREENSAVERFILE
# eips 40 39 "Batt:${batt}%"
```

图片仍会正常下载到：

```text
/mnt/us/linkss/screensavers/bg_ss00.png
```

下一次进入屏保时由 Screensaver Hack 正常显示。

这是 **Oasis 2 实机验证** 的处理方式，其他型号未必需要。

KPW3 部署也采用“只下载、不调用 `eips` 强刷”的方式，并已实机验证。

## KPW3 / BusyBox shell 兼容性

peterson 版 Online Screensaver 的部分脚本使用：

```sh
source config.sh
source utils.sh
```

KPW3 上可能出现：

```text
source: config.sh: not found
```

这通常不是文件真的丢失，而是脚本没有显式指定当前目录。请把 `update.sh`、`scheduler.sh`、`enable.sh`、`disable.sh`、`checkschedule.sh` 中的加载语句统一改为：

```sh
. ./config.sh
. ./utils.sh
```

同时保持所有 shell 文件为 UTF-8、LF 换行。

## 推荐的下载策略

不建议把 `ping` 某个域名作为下载前置门槛。ICMP 失败不代表 HTTPS 下载失败，反之也一样。更可靠的方式是直接以真实下载结果为准：

```text
wget 直接请求目标图片
失败最多重试 3 次
请求 URL 附加时间戳，绕过 CDN 缓存
下载到目标目录内的临时文件
确认文件非空后原子替换 bg_ss00.png
不调用 eips，由 Screensaver Hack 显示
```

临时文件应与正式文件位于同一文件系统，例如：

```sh
DOWNLOAD_FILE="${SCREENSAVERFILE}.download"
```

这样可避免 `/tmp` 到 `/mnt/us` 的跨文件系统 ownership 警告；下载失败时也不会破坏旧屏保。

## Kindle 系统“显示封面”

如果屏保底部出现“在此选择要读的图书并查看其封面”之类提示，那是 Kindle 自带的「显示封面 / Display Cover」界面，不是本项目图片内容。

关闭 Kindle 系统里的「显示封面」即可。

## 多张屏保轮播

自动豆瓣秀固定使用：

```text
bg_ss00.png
```

可以继续放：

```text
bg_ss01.png
bg_ss02.png
bg_ss03.png
...
```

这样豆瓣秀可与其他图片轮替；自动更新只覆盖 `bg_ss00.png`。

## 封面缓存

豆瓣图片服务器偶尔会请求失败，因此项目已经加入：

```text
有效缓存优先
+ 下载失败重试 3 次
+ GitHub Actions 持久缓存
```

流程：

```text
已有有效缓存 → 直接使用
没有缓存     → 下载
下载失败     → 重试
仍然失败     → 灰色占位
```

缓存目录 `covers/` 已加入 `.gitignore`，无需提交到仓库。

## 手动排错

如果网页已经更新而 Kindle 没更新，先区分“Screensaver Hack 正常”与“在线下载正常”。安装后显示的成功提示图只是 linkss 自带示例图，不代表豆瓣秀已经下载。

可以 SSH 到 Kindle 手动运行：

```sh
cd /mnt/us/extensions/onlinescreensaver/bin
sh ./update.sh
```

查看日志：

```sh
tail -n 50 /mnt/us/onlinescreensaver.log
```

检查目标图片：

```sh
ls -l /mnt/us/linkss/screensavers/bg_ss00.png
file /mnt/us/linkss/screensavers/bg_ss00.png
```

检查真正生效的配置：

```sh
grep -n "IMAGE_URI\|SCHEDULE\|SCREENSAVERFILE" config.sh
```

实际踩过的一个坑是：

```sh
#IMAGE_URI="正确地址"
IMAGE_URI=""
```

第一行只是注释；真正生效的仍是空值。

还应检查：

- KPW3 的目标图应为 1072 × 1448，Oasis 2 的目标图应为 1264 × 1680
- 文件时间和大小是否真的变化；旧日期可能说明仍在显示 linkss 示例图
- 日志是否停在配置加载、Wi-Fi、下载或替换步骤
- `source config.sh: not found` 时改用 `. ./config.sh`
- 不要仅凭 `ping` 失败断言网络不可用，应直接测试目标 HTTPS 图片

KUAL 点 `Update now` 后迅速回到菜单，本身不代表失败。动作可能仍在运行；不要立刻插入 USB，否则 `/mnt/us` 切换存储模式可能打断脚本。优先通过 Wi-Fi SSH 查看实时日志，或等待足够时间后再检查目标文件。

## 本地运行

需要 Node.js 24。

```powershell
npm ci
```

Windows PowerShell：

```powershell
$ID = (Get-Content .\config.json | ConvertFrom-Json).doubanUserId

npx.cmd @marvae24/douban-cli book export $ID --reading -f json -o reading-export.json
npx.cmd @marvae24/douban-cli book export $ID --wish -f json -o wish-export.json
npx.cmd @marvae24/douban-cli book export $ID -f json -o read-export.json
node resolve-profile.js
node render.js
node resize-output.js
```

输出：

```text
bg_ss00.png    # 基础输出，默认 1264 × 1680
bg_kpw3.png    # deviceOutputs 生成，1072 × 1448
```

基础 PNG 尺寸由 `screenWidth` / `screenHeight` 决定；额外设备图片由 `deviceOutputs` 生成。

## 字体

GitHub Actions 的 Ubuntu Runner 默认不保证有合适的中文字体，因此仓库附带并注册 Noto CJK 字体：

```text
fonts/NotoSerifCJKsc-Regular.otf
```

字体来自 Noto CJK 项目，并遵循其自身开源许可证；字体文件不视为本项目代码许可证的一部分。

## 数据与隐私

- 不需要豆瓣密码或 Cookie
- 只读取公开可访问的豆瓣数据
- 构建产生的 JSON、封面缓存和 PNG 不提交到仓库
- 本项目不是豆瓣官方项目，也与豆瓣无隶属关系

## 已知限制

- 基础布局仍以 1264 × 1680 的 Kindle Oasis 2 / 3 为基准；其他列出的机型采用最终图片缩放适配
- 未针对 Kindle Scribe 等大屏设备设计版式
- 豆瓣页面结构变化可能导致 `douban-cli` 或昵称自动解析暂时失效
- 不同 Kindle / 固件上的 Online Screensaver 行为可能不同
- Screensaver Hack 最适合使用与设备原生分辨率完全一致的 PNG
- 飞行模式下定时更新可能失败，恢复网络后会在后续调度或唤醒时再次尝试

## Credits

本项目组合使用或参考：

- `@marvae24/douban-cli`
- `sharp`
- `poja1993/onlinescreensaver`
- Kindle Screensaver Hack / linkss
- Noto CJK
- ChatGPT：脚本、排错与自动化流程协助
