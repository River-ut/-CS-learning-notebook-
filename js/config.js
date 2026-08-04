// ============================================================
// CONFIG — 静态常量
// ============================================================
import { uuid } from './utils.js';

export const CATEGORIES = [
  { id: 'all',      name: '全部分类',          icon: '📁' },
  { id: 'ds-algo',  name: '数据结构与算法',     icon: '🌳' },
  { id: 'os',       name: '操作系统',           icon: '💻' },
  { id: 'network',  name: '计算机网络',         icon: '🌐' },
  { id: 'database', name: '数据库',             icon: '🗄️' },
  { id: 'prog-lang',name: '编程语言',           icon: '⌨️' },
  { id: 'comp-org', name: '计算机组成原理',      icon: '🔧' },
  { id: 'sw-eng',   name: '软件工程',           icon: '🏗️' },
  { id: 'design-pt',name: '设计模式',           icon: '📐' },
  { id: 'compiler', name: '编译原理',           icon: '⚙️' },
  { id: 'arch',     name: '计算机体系结构',      icon: '🖥️' },
  { id: 'ai-ml',    name: '人工智能/机器学习',   icon: '🧠' },
  { id: 'security', name: '信息安全',           icon: '🔒' },
  { id: 'other',    name: '其他',               icon: '📝' }
];

export const AVAILABLE_ICONS = ["📁","🌳","💻","🌐","🗄️","⌨️","🔧","🏗️","📐","⚙️","🖥️","🧠","🔒","📝","📚","📖","✏️","🎓","📊","📈","🔬","🎯","💡","⭐","🔥","🚀","💎","🎨","🔗","📌","🗂️","🧮","📡","🛠️","🤖","🐍","☕","🦀","🐘","⚛️","🐳","🔷","🟢","🟠"];

export const DEFAULT_SETTINGS = {
  activeNoteId: null, activeCategory: 'all', searchQuery: '',
  sortBy: 'updatedAt', sortOrder: 'desc', sidebarOpen: true,
  editorSplitRatio: 0.5, vSplitRatio: 0.3
};

export const SAMPLE_NOTES = [
  {
    id: uuid(),
    title: '快速排序算法分析',
    category: 'ds-algo',
    content: '## 快速排序 (Quick Sort)\n\n快速排序是一种**分治算法**，由 C.A.R. Hoare 于 1960 年提出。\n\n### 核心思想\n\n1. 选择一个 **基准元素** (pivot)\n2. 将数组分为两部分：小于 pivot 的放左边，大于的放右边\n3. 递归地对左右两部分排序\n\n```python\ndef quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)\n```\n\n### 复杂度\n\n| 情况 | 时间复杂度 |\n|------|-----------|\n| 最好 | O(n log n) |\n| 平均 | O(n log n) |\n| 最坏 | O(n²) |\n\n> 实际应用中通常比归并排序更快，因为常数因子更小。',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isPinned: true
  },
  {
    id: uuid(),
    title: '进程与线程的区别',
    category: 'os',
    content: '## 进程 vs 线程\n\n### 进程 (Process)\n- 操作系统**资源分配**的基本单位\n- 拥有独立的地址空间、内存、文件描述符\n- 进程间通信 (IPC) 开销较大\n\n### 线程 (Thread)\n- CPU **调度执行**的基本单位\n- 同一进程内的线程共享地址空间\n- 线程切换开销远小于进程切换\n\n### 关键区别\n\n| 维度 | 进程 | 线程 |\n|------|------|------|\n| 资源 | 独立 | 共享 |\n| 创建开销 | 大 | 小 |\n| 通信 | IPC (管道/消息队列/共享内存) | 直接读写共享变量 |\n| 隔离性 | 强 | 弱 |\n\n> 一个进程崩溃不会影响其他进程；一个线程崩溃可能拖垮整个进程。',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    isPinned: false
  },
  {
    id: uuid(),
    title: 'B+树索引原理',
    category: 'database',
    content: '## B+ 树索引\n\nB+ 树是数据库索引最常用的数据结构。\n\n### 结构特点\n- 所有**数据只存储在叶子节点**\n- 非叶子节点仅存储索引键用于导航\n- 叶子节点之间用链表连接，支持范围查询\n\n### 为什么用 B+ 树？\n\n1. **磁盘 I/O 友好**：每个节点大小匹配一个磁盘页 (通常 4KB/16KB)\n2. **高扇出** (high fanout)：树的高度很低，查找只需 2-4 次 I/O\n3. **范围查询高效**：叶子链表可直接遍历\n\n### 与 B 树的区别\n- B 树所有节点都存储数据\n- B+ 树只在叶子存数据 → 非叶子能存更多索引键 → 树更矮\n\n```sql\n-- MySQL 创建 B+ 树索引\nCREATE INDEX idx_name ON users(name);\n\n-- 范围查询利用叶子链表\nSELECT * FROM users WHERE name BETWEEN \'A\' AND \'M\';\n```',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    isPinned: false
  }
];
