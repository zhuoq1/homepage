# 配置 Mac

## **0 Macbook配置与基本信息**

**14-inch MacBook Pro - Silver**

- [https://support.apple.com/zh-cn/111902](https://support.apple.com/zh-cn/111902)

## **1 系统偏好设置**

### **1.1 触控板**

位置：系统偏好 - 触控板 - 点按以选中

位置：系统偏好 - 辅助功能 - 指针控制 - 触控板选项 - 启用三指拖移

### **1.2 显示文件路径**

访达并不是那么好用，为了更直接的了解当前文件所在位置，个人建议显示文件的路径

方法：打开终端（Terminal）使用以下命令

`defaults write com.apple.finder ShowPathbar -bool true`

### **1.3 触发角**

左下：启动屏幕保护程序

右下：显示桌面

位置：系统偏好 - 桌面与屏幕保护程序 - 触发角

### 1.4 输入法 & 输入法快捷键

苹果日语输入法 + 搜狗输入法

位置：设置 - 键盘 - 键盘快捷键 - 输入法

- 选择上一个输入法：⌘ + 空格键
- 显示聚焦窗口：⌥ + 空格键
- Alfred: ⌃ + 空格键

### **1.5 外来应用权限**

许多在软件官网下载安装包会因为苹果的安全限制无法打开，可以进入：系统偏好设置 - 安全性与隐私 - 通用，允许任意来源软件的安装。

![](https://pic1.zhimg.com/80/v2-1bae1156ca4d39bec42415fa9486c860_1440w.webp)

Security and Privacy

顺便可以解锁让Apple Watch解锁Mac的功能（记得先解锁Apple Watch）

Remark：如果找不到“任意来源”，可以使用命令行命令（需要输入PIN）：

`sudo spctl --master-disable`

### 1.6 取消密码位数限制

`pwpolicy -clearaccountpolicies`

### 1.7 取消简中输入法大写键切换延迟

`hidutil property --set '{"CapsLockDelayOverride":0}'`

### 1.7 Dock栏

创建空白图标：

`defaults write com.apple.dock persistent-apps -array-add '{tile-data={}; tile-type="spacer-tile";}'; Killall Dock`

### 1.8 Finder 边栏和程序坞

Finder边栏 - 右键「下载」「应用程序」 - 添加到程序坞

### 1.9 Dock Layout

![截屏2022-11-06 20.56.38.png](%E9%85%8D%E7%BD%AE%20Mac/%25E6%2588%25AA%25E5%25B1%258F2022-11-06_20.56.38.png)

## 2 **常用软件**

### **2.1 日常**

1. [微信](https://mac.weixin.qq.com/?t=mac&lang=zh_CN)
2. [Steam](https://store.steampowered.com/about/)
3. [IINA](https://iina.io)
4. Unsplash Wallpaper（Mac App Store）
5. [迅雷](https://mac.xunlei.com)
6. [The Unarchiver](https://theunarchiver.com)
7. [Downie 4](https://software.charliemonroe.net/downie/)
8. AdGuard

### **2.2 工作**

1. [Notion](https://www.notion.so/desktop)
2. Pages / Keynote / Numbers （Mac App Store）
4. [Chrome](https://www.google.com/chrome/)
5. [Zoom](https://zoom.us/download#client_4meeting) / Cisco Webex / [腾讯会议](https://meeting.tencent.com/download/)
6. [Outlook](https://www.microsoft.com/ja-jp/microsoft-365/outlook/email-and-calendar-software-microsoft-outlook) / [Teams](https://www.microsoft.com/ja-jp/microsoft-teams/download-app)

### **2.3 开发**

1. [VS Code](https://code.visualstudio.com)
2. [Alfred](https://www.alfredapp.com)
3. [Antigravity](https://antigravity.google/product/antigravity-ide)

## 3 **命令行工具与包管理**

### **3.1 Xcode Command Line Tool**

`xcode-select --install`

### **3.2 [HOMEBREW](https://brew.sh)**

Homebrew是一款经典的开源软件包管理系统，它可被用来简化macOS系统上的软件安装过程。

`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

随后执行以下命令（会默认替换username），将Homebrew添加到环境变量

`echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/username/.config/fish/config.fish
eval "$(/opt/homebrew/bin/brew shellenv)"`

使用Homebrew安装以下软件包

`brew install \
  wget \
  exa \
  git \
  nvm \
  pnpm \
  vips`

### 3.3 [Ghostty](https://ghostty.org) & Fish Shell

Ghostty 是一款原生的、高性能的终端模拟器，使用 Zig 编写，支持 GPU 加速渲染和丰富的自定义选项。

Fish (Friendly Interactive Shell) 是一款开箱即用的现代化命令行工具，内置语法高亮、自动补全和自动建议等功能，无需像 zsh 那样安装额外插件即可享受出色的终端体验。

[https://fishshell.com](https://fishshell.com)

通过 Homebrew 安装 Ghostty 和 Fish：

`brew install ghostty fish`

将 Fish 设为默认 shell：

`echo /opt/homebrew/bin/fish | sudo tee -a /etc/shells
chsh -s /opt/homebrew/bin/fish`

Fish 的配置文件位于 `~/.config/fish/config.fish`，可通过 Web 界面进行配置：

`fish_config`

**3.3.1 Google Cloud SDK**

You can download the Google Cloud SDK from this link: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

Then:

`./google-cloud-sdk/install.sh`

### 3.4 uv

uv 是由 Astral 开发的超快速 Python 包管理器和项目管理工具，用 Rust 编写，可替代 pip、venv、poetry、pyenv 等工具。

[https://docs.astral.sh/uv](https://docs.astral.sh/uv)

通过 Homebrew 安装 uv：

`brew install uv`

常用命令：

`uv python install 3.12     # 安装指定版本的 Python
uv venv                     # 创建虚拟环境
uv pip install <package>    # 安装 Python 包
uv sync                     # 根据 pyproject.toml 同步依赖
uv run <script>             # 在项目环境中运行脚本`

### 3.5 ssh settings

To generate an SSH key pair, follow these steps:

1. Open the Terminal application.
2. Type the following command: `ssh-keygen -t rsa -b 4096 -C "your_email@example.com"`
3. Press Enter to accept the default file name and location for the key pair.
4. Enter a passphrase for the key pair when prompted. This is optional but recommended for added security.
5. Once the key pair is generated, navigate to the folder where the key pair is stored using the `cd` command. By default, the key pair is stored in the `~/.ssh/` folder.
6. Use the `cat` command to print the public key to the Terminal: `cat ~/.ssh/id_rsa.pub`

Note: Replace "[your_email@example.com](mailto:your_email@example.com)" with your actual email address.

### 3.5 VS Code

**3.4.1 Code Formatting Tools**

black

flake8

isort