import '../../CS学习记事本.css';
import '../../tasks.css';
import '../../themes.css';
import BrowserSetup from '../browser-setup';

export default function Page() {
  return (
    <>
<div className={"login-screen"} id={"loginScreen"}>
  <div className={"login-card"}>
    <label className={"theme-control"}>外观 <select data-theme-select="" aria-label={"登录页主题"}><option value={"system"}>跟随系统</option><option value={"dark"}>深色</option><option value={"light"}>浅色</option></select></label>
    <div className={"login-logo"}>📘</div>
    <h1 className={"login-app-name"}>个人学习工作台</h1>
    <h2 id={"loginTitle"}>登录</h2>
    <p className={"login-sub"} id={"loginSub"}>登录后即可同步你的笔记到云端</p>
    <input type={"email"} id={"loginEmail"} placeholder={"邮箱"} autoComplete={"username"} />
    <input type={"password"} id={"loginPassword"} placeholder={"密码"} autoComplete={"current-password"} />
    <div className={"login-error"} id={"loginError"} style={{"display": "none"}}></div>
    <button className={"btn btn-primary login-submit"} id={"loginSubmit"}>登录</button>
    <p className={"login-toggle"}><span id={"loginToggleText"}>没有账号？</span>{" "}<a href={"#"} id={"loginToggle"}>注册</a></p>
    <div className={"guest-entry"}><button className={"btn"} id={"tryGuest"}>无需账号，立即试用 →</button><p>待办与笔记保存在本地浏览器，可随时回来继续使用。</p></div>
  </div>
</div>

<div id={"sidebarOverlay"}></div>
<header id={"workspaceNav"} hidden>
  <a href={"/"} data-home="">个人主页</a><a href={"/"}>产品介绍</a><strong>学习工作台</strong>
  <button className={"btn"} id={"showTasks"}>✓ 待办</button>
  <button className={"btn"} id={"showNotes"}>📘 笔记</button>
  <span id={"workspaceUser"}></span><button className={"btn"} id={"workspaceLogout"}>退出</button>
  <select className={"theme-select"} data-theme-select="" aria-label={"工作台主题"}><option value={"system"}>跟随系统</option><option value={"dark"}>深色</option><option value={"light"}>浅色</option></select>
</header>
<main id={"tasksApp"} hidden></main>

<div id={"app"}>
  <aside id={"sidebar"}>
    <div className={"sidebar-header"}>
      <h1><span className={"logo"}>📘</span> CS学习记事本</h1>
    </div>
    <div className={"search-wrap"}>
      <input type={"text"} id={"searchInput"} placeholder={"🔍 搜索笔记…"} autoComplete={"off"} />
      <button className={"clear-btn"} id={"clearSearch"} title={"清除"}>✕</button>
    </div>
    <nav className={"category-list"} id={"categoryList"}></nav>
    <button className={"add-cat-btn"} id={"btnAddCategory"}>＋ 添加分类</button>
    <div className={"sidebar-footer"} id={"statsDisplay"}>共 0 条笔记</div>
    <div className={"user-footer"} id={"userFooter"} style={{"display": "none"}}>
      <span className={"user-email"} id={"userEmail"}></span>
      <button className={"btn btn-sm"} id={"btnLogout"} title={"退出登录"}>⏻ 退出</button>
    </div>
  </aside>

  <div className={"main-area"}>
    <div className={"toolbar"}>
      <button className={"btn btn-icon"} id={"btnToggleSidebar"} title={"菜单"}>☰</button>
      <button className={"btn btn-primary"} id={"btnNewNote"}>＋ 新建笔记</button>
      <button className={"btn"} id={"btnExport"}>📥 导出</button>
        <button className={"btn"} id={"btnOpenFile"}>📂 打开文件</button>
        <button className={"btn"} id={"btnImport"}>📤 导入备份</button>
        <input type={"file"} id={"importInput"} style={{"display": "none"}} accept={".json"} />
        <input type={"file"} id={"fileInput"} style={{"display": "none"}} accept={".txt,.md,.js,.py,.c,.cpp,.java,.json,.xml,.csv,.html,.css,.ts,.rs,.go,.yaml,.yml,.toml,.ini,.cfg,.log,.sh,.bat,.ps1"} />
        <input type={"file"} id={"imageInput"} style={{"display": "none"}} accept={"image/*"} />
      <span className={"toolbar-spacer"}></span>
      <div className={"sort-group"}>
        <span>排序:</span>
        <select id={"sortSelect"}>
          <option value={"updatedAt-desc"}>最近修改</option>
          <option value={"updatedAt-asc"}>最早修改</option>
          <option value={"createdAt-desc"}>最近创建</option>
          <option value={"title-asc"}>标题 A-Z</option>
        </select>
      </div>
    </div>

    <div id={"noteListWrap"}>
      <div id={"noteList"}></div>
    </div>

    <div id={"vPaneDivider"} className={"v-divider"}></div>

    <div id={"editorPanel"}>
      <div className={"editor-toolbar"}>
        <input type={"text"} id={"noteTitle"} placeholder={"笔记标题…"} maxLength={"200"} />
        <select id={"noteCategory"}></select>
        <button className={"btn btn-sm"} id={"btnInsertImage"} title={"插入图片（也可直接 Ctrl+V 粘贴截图）"}>🖼 图片</button>
        <button className={"btn btn-sm btn-primary"} id={"btnSaveNote"}>💾 保存</button>
        <button className={"btn btn-sm btn-danger"} id={"btnDeleteNote"}>🗑 删除</button>
      </div>
      <div className={"editor-body"}>
        <textarea id={"editorTextarea"} placeholder={"在此编写 Markdown…\n\n## 标题\n内容支持 **粗体** *斜体* `代码`\n\n```python\nprint('代码块')\n```\n\n- 列表项\n- [x] 已完成任务\n\n> 引用"}></textarea>
        <div id={"paneDivider"}></div>
        <div className={"preview-pane"}>
          <button className={"preview-fullscreen-btn"} id={"btnPreviewFullscreen"} title={"全屏预览"}>⛶</button>
          <div id={"previewContent"}></div>
        </div>
      </div>
      <div className={"editor-footer"}>
        <span id={"saveStatus"}>✅ 已保存</span>
            <span className={"file-indicator"} id={"fileIndicator"} style={{"display": "none"}}>📄 <span id={"fileNameDisplay"}></span></span>
        <span id={"lastSavedTime"} style={{"color": "var(--text-muted)"}}></span>
        <span className={"right"}>
          <button className={"btn btn-sm"} id={"btnFormatBold"} title={"Ctrl+B"}>B</button>
          <button className={"btn btn-sm"} id={"btnFormatItalic"} title={"Ctrl+I"}><i>I</i></button>
          <button className={"btn btn-sm"} id={"btnFormatCode"} title={"Ctrl+`"}>{"</>"}</button>
        </span>
      </div>
    </div>
  </div>
</div>

<div className={"modal-overlay"} id={"categoryDialog"}>
  <div className={"modal"}>
    <h2>📁 新建学习分类</h2>
    <label>分类名称</label>
    <input type={"text"} id={"catNameInput"} placeholder={"输入分类名称…"} maxLength={"30"} />
    <label>选择图标</label>
    <div className={"icon-picker"} id={"iconPicker"}></div>
    <div className={"modal-actions"}>
      <button className={"btn"} id={"catCancel"}>取消</button>
      <button className={"btn btn-primary"} id={"catOk"}>✅ 创建</button>
    </div>
  </div>
</div>

<div className={"modal-overlay"} id={"confirmDialog"}>
  <div className={"modal"}>
    <h2 id={"confirmTitle"}>确认删除？</h2>
    <p id={"confirmMsg"}>此操作不可撤销。</p>
    <div className={"modal-actions"}>
      <button className={"btn"} id={"confirmCancel"}>取消</button>
      <button className={"btn btn-danger"} id={"confirmOk"}>确认删除</button>
    </div>
  </div>
</div>

<div className={"modal-overlay"} id={"exportDialog"}>
  <div className={"modal"}>
    <h2>导出笔记</h2>
    <p>选择导出范围和格式：</p>
    <select id={"exportScope"}>
      <option value={"current"}>当前笔记</option>
      <option value={"category"}>当前分类</option>
      <option value={"all"}>全部笔记</option>
    </select>
    <select id={"exportFormat"}>
      <option value={"md"}>Markdown (.md)</option>
      <option value={"txt"}>纯文本 (.txt)</option>
    </select>
    <div className={"modal-actions"}>
      <button className={"btn"} id={"exportCancel"}>取消</button>
      <button className={"btn btn-primary"} id={"exportOk"}>📥 下载</button>
    </div>
  </div>
</div>

<div className={"image-viewer"} id={"imageViewer"}>
  <img id={"imageViewerImg"} alt={"图片预览"} />
</div>

<div id={"toastContainer"}></div>
      <BrowserSetup workspace />
    </>
  );
}
