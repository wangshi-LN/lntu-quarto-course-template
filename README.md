# 辽宁工程技术大学课程模板

面向辽宁工程技术大学课程教学的 HTML 幻灯片模板，使用 Markdown / Quarto 编辑。保留学校标识、校园插画、浅青绿色与暖白配色，以及 4∶3 页面版式；支持页面批注、黑板和演讲者双窗口笔迹同步。

**[下载完整课件包 v1.5.0（ZIP，约 36 MB）](https://github.com/wangshi-LN/lntu-quarto-course-template/releases/download/v1.5.0/lntu-quarto-course-template-v1.5.0.zip)** · [版本说明与校验文件](https://github.com/wangshi-LN/lntu-quarto-course-template/releases/tag/v1.5.0)

本项目由个人维护，并非学校官方模板。包内是模板课件和版式示例，不包含完整课程的教学内容。

## 下载后直接播放

1. 下载上方的**完整课件包**，将 ZIP 全部解压到普通文件夹。
2. 双击 `打开课件.cmd` 或 `course.html`，打开模板课件。
3. 双击 `查看版式.cmd` 或 `layouts.html`，查看全部版式示例。

播放只需现代 Edge 或 Chrome，**无需安装 Quarto、Python、R 或 Jupyter**。本地图片、字体和示例视频可离线使用，B 站等网络视频需要联网。

请保留解压后的目录结构，不要只复制 HTML，也不要在压缩包预览窗口中直接打开。GitHub 的 **Code → Download ZIP** 和 Release 中的 **Source code** 只包含源码；需要直接播放时，请下载上方的完整课件包。

## 制作自己的课件

编辑和生成需要 Windows、PowerShell 与 Quarto；本模板使用 Quarto **1.10.18** 生成，不需要 R 或 Jupyter。完整课件包已包含可编辑源码，也可以下载或克隆本仓库。

1. 在模板目录双击 `新建课程.cmd`，填写一个尚不存在的新课程文件夹路径。
2. 在新课程目录编辑下表中的文件，填写课程信息并替换示例内容。
3. 双击 `生成课件.cmd`，生成正式课件和版式示例。
4. 双击 `打开课件.cmd` 播放。以后修改源文后，再运行一次生成脚本。

| 文件 | 编辑内容 |
|---|---|
| [course.yml](course.yml) | 课程名称、副标题、授课教师和校徽路径；封面与结束页背景沿用模板素材 |
| [course.qmd](course.qmd) | 正式课件源文，提供 6 页起步稿；生成 `course.html` |
| [layouts.qmd](layouts.qmd) | 15 页版式示例，按需复制到正式课件中；生成 `layouts.html` |

新建课程脚本会复制源码、必要素材和许可说明，不复制已生成的 HTML，因此新副本需要先生成一次。模板目录保留用于维护，具体课程内容写在各自的副本中。

### 页面与内容

模板包含封面、章节目录、结束页，以及单栏、双栏、对比、卡片、图片、图文混排、网络视频和本地视频等内容版式。

- 从 `layouts.qmd` 复制需要的页面，保留已有结构和样式；每页以 `##` 开始。
- 每页的 `#页面ID` 必须唯一，目录链接写成 `#/页面ID`。正文的 `data-chapter-title` 填写所属章节，教师姓名统一从 `course.yml` 读取。
- 主标题 48pt、封面副标题 40pt、三级标题 32pt、正文 24pt。内容放不下时拆页；Markdown 加粗显示为深朱红，单星号强调显示为 28pt 正体。
- 思源黑体和思源宋体随包提供，无需安装。页脚使用系统楷体，缺少时会回退。

<details>
<summary>章节目录的写法</summary>

每章开始复制一张目录页，修改页面 ID、章节名称和当前项：

```markdown
## 内容目录 {#contents-1 .body-header-preview .contents-page data-chapter-title="第一章"}

::: {.course-toc current="1"}
- [第一章](#/first-content "第一章的内容说明")
- [第二章](#/second-content "第二章的内容说明")
:::
```

`current="1"` 突出第 1 项，第二章改为 `current="2"`。列表顺序自动生成编号；链接指向对应章节的正文首页，引号内的章节说明可省略。增加或调整章节时，同步修改各章目录中的文字和链接。

</details>

## 授课常用功能

| 按键或按钮 | 功能 |
|---|---|
| `S` | 打开演讲者窗口（Speaker View），需允许浏览器弹窗 |
| `C` | 开关当前窗口的页面批注 |
| `B` | 开关黑板 |
| 删除涂鸦 | 清除当前页、当前画布的笔迹 |
| 导出涂鸦 | 将整份课件的笔迹保存为 JSON 文件 |

演讲者窗口的“当前页”和投影主窗口支持双向笔迹、擦除及删除同步；黑板开关和黑板切换也会同步。“下一页预览”不参与同步。主窗口保持打开时，重新打开演讲者窗口可恢复已有笔迹。

**刷新或关闭主窗口前，请导出涂鸦并确认文件已下载。** 双窗口同步不提供跨次打开的自动保存。需要再次载入笔迹时，将 JSON 放入课程目录，在 `_quarto.yml` 的 `chalkboard` 配置下设置 `src: chalkboard.json`，然后重新生成；调整幻灯片顺序后需核对笔迹对应关系。

## 携带与导出

最方便的方式是复制整个课程文件夹。若只分发播放文件，至少保留以下结构；自行添加到其他目录的资源也要一起携带：

```text
课程文件夹/
├─ course.html
├─ course_files/
└─ assets/
```

版式示例对应 `layouts.html` 和 `layouts_files/`。分发时同时保留 `LICENSE`、`THIRD_PARTY_NOTICES.md` 及资源附带的许可文件。

<details>
<summary>生成命令、单文件导出与本地服务器</summary>

在课程目录的 PowerShell 中运行：

| 命令 | 输出 |
|---|---|
| `.\build.ps1 -Target all` | 正式课件和版式示例，与 `生成课件.cmd` 相同 |
| `.\build.ps1 -Target course` | 仅正式课件 |
| `.\build.ps1 -Target layouts` | 仅版式示例 |
| `.\build.ps1 -Target single` | 单文件 `course-single.html`，关闭涂鸦 |

单文件模式嵌入默认字体与本地示例素材，不覆盖 `course.html`；网络视频仍需联网，标记为 `data-external="1"` 的资源仍需单独携带。长视频或大量图片建议保留默认的资源文件夹形式。同一目录内不要同时运行多个生成进程。

双击 HTML 即可播放。若需要本地 HTTP 播放，可在已有 Python 的电脑运行 `python serve.py`，然后打开 `http://127.0.0.1:18768/course.html`。播放期间保持终端运行，按 `Ctrl+C` 停止。

</details>

## 许可与维护

项目自有模板代码、脚本、配置、示例源文和说明文档采用 [MIT 许可证](LICENSE)，版权署名为 **Wang Shi**。学校标识、校园插画、字体及其他媒体的许可范围和来源见 [素材与第三方许可说明](THIRD_PARTY_NOTICES.md)，不统一纳入 MIT 许可。

仓库跟踪源码和必要素材，生成的 HTML、渲染资源与缓存不纳入 Git；可直接播放的完整包通过 [Releases](https://github.com/wangshi-LN/lntu-quarto-course-template/releases) 发布。维护时使用 Git 提交和版本标签，课程副本按需单独更新。

- [版本说明](RELEASE_NOTES.md)：完整包的内容、生成与校验信息。
- [验证记录](验证记录.md)：功能检查记录与验证环境。
- [素材来源](素材来源.md)：视觉素材的来源和制作记录。
- [分发打包脚本](scripts/package-release.py)：供维护者在生成 HTML 后制作完整包。
