# Douban Kindle Screensaver / Kindle 豆瓣秀

把豆瓣读书里的「在读 / 读过 / 想读」自动生成一张 Kindle 屏保，并通过 GitHub Actions + GitHub Pages 定时更新。

这个项目的起点，是已经消失的老豆瓣功能「豆瓣秀」：以前可以把自己的豆瓣动态放在个人博客首页。我一直很喜欢它。现在换一种方式，把它“复活”到了 Kindle 上。

> 把已经消失的「豆瓣秀」，从博客首页搬到 Kindle 屏幕上。

当前版式按 **Kindle Oasis 2（1264 × 1680）** 设计。

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
render.js
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

**正常情况下，唯一必须修改的是豆瓣用户 ID。**

```json
{
  "doubanUserId": "1105344",
  "displayName": "",
  "pageTitle": "",
  "subtitle": "近 半 年 阅 读"
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
Fork → 改 doubanUserId → 开启 Pages → Run workflow
```

本项目只读取豆瓣公开页面，不需要账号密码、Cookie 或 Token。因此「在读 / 读过 / 想读」需要能被公开访问。

昵称同样从公开的豆瓣读书主页自动读取。如果豆瓣临时阻止访问或页面结构变化导致昵称解析失败，脚本会退回显示豆瓣 ID / 通用“豆瓣秀”，**不会继续显示仓库作者的昵称**。

### 3. 开启 GitHub Pages

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
Kindle Oasis 2
Firmware 5.16.2.1.1
1264 × 1680
```

其他 Kindle 可以尝试，但不同分辨率需要调整 `render.js` 中的尺寸和布局。

### Online Screensaver 关键配置

把自己的 Pages 图片地址填入 `config.sh`：

```sh
SCHEDULE="00:00-24:00=720"
IMAGE_URI="https://<username>.github.io/<repo>/bg_ss00.png"
SCREENSAVERFOLDER=/mnt/us/linkss/screensavers/
SCREENSAVERFILE=$SCREENSAVERFOLDER/bg_ss00.png
DISABLE_WIFI=0
NETWORK_TIMEOUT=60
RTC=1
```

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

如果网页已经更新而 Kindle 没更新，可以 SSH 到 Kindle：

```sh
cd /mnt/us/extensions/onlinescreensaver/bin
sh ./update.sh
```

查看日志：

```sh
tail -n 50 /tmp/onlinescreensaver.log
```

检查目标图片：

```sh
ls -l /mnt/us/linkss/screensavers/bg_ss00.png
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
```

输出：

```text
bg_ss00.png
```

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

- 当前布局主要适配 1264 × 1680 的 Kindle Oasis 2
- 豆瓣页面结构变化可能导致 `douban-cli` 或昵称自动解析暂时失效
- 不同 Kindle / 固件上的 Online Screensaver 行为可能不同
- 飞行模式下定时更新可能失败，恢复网络后会在后续调度或唤醒时再次尝试

## Credits

本项目组合使用或参考：

- `@marvae24/douban-cli`
- `sharp`
- `poja1993/onlinescreensaver`
- Kindle Screensaver Hack / linkss
- Noto CJK
- ChatGPT：脚本、排错与自动化流程协助
