# implementation-plan.md — Personal Finance Tracker

> **通用约定**
> - Java 包名：`com.billingbook`
> - API 错误统一返回：`{"error": "message"}`
> - 不做分页，按月全量返回
> - Session 使用 in-memory 存储（重启需重新登录）

---

## Phase 1: 项目初始化

### Step 1: 初始化后端项目
**Goal:** 创建可运行的 Spring Boot 项目骨架
**Instructions:**
- 用 Spring Initializr 创建项目（包名 `com.billingbook`），选择依赖：Spring Web、Spring Data JPA、
  Spring Security、PostgreSQL Driver、Lombok
- 确认项目结构：controller / service / repository / model / config 五个包
- 配置 application.properties，连接本地 PostgreSQL（通过 Docker Compose）
- 写一个 GET /api/health 端点，返回字符串 "ok"
**Validation:** 启动项目后访问 localhost:8080/api/health，浏览器返回 "ok"

---

### Step 2: 本地数据库环境
**Goal:** 用 Docker Compose 在本地跑 PostgreSQL
**Instructions:**
- 写 docker-compose.yml，定义一个 PostgreSQL 容器
- 数据库名、用户名、密码写在 docker-compose.yml 和 application.properties 里
- 确认 Spring Boot 启动时能成功连接数据库，不报错
**Validation:** docker compose up 启动后，Spring Boot 日志显示数据库连接成功

---

### Step 3: 初始化前端项目
**Goal:** 创建可运行的 React 项目骨架
**Instructions:**
- 用 Vite 创建 React 项目
- 安装 Tailwind CSS 并完成配置
- 安装 Axios、Recharts
- 写一个最简单的首页，显示文字 "Personal Finance Tracker"
- 配置 Axios baseURL 指向 localhost:8080
**Validation:** 启动前端后浏览器显示首页文字，无控制台报错

---

## Phase 2: 登录系统

### Step 4: 后端登录接口
**Goal:** 实现单用户登录，返回 Session Cookie
**Instructions:**
- 在环境变量里配置 APP_USERNAME 和 APP_PASSWORD
- 配置 Spring Security，关闭默认登录页，改为自定义 REST 接口
- 实现 POST /api/auth/login：接收 username + password，
  验证通过后创建 Session，返回 200；失败返回 401 + `{"error": "用户名或密码错误"}`
- 实现 POST /api/auth/logout：清除 Session，返回 200
- 实现 GET /api/auth/me：已登录返回 200，未登录返回 401（用于前端检测登录状态）
- Session Cookie 设置为 HttpOnly，有效期 7 天
- Session 使用 in-memory 存储（重启需重新登录）
- 配置 Spring Boot CORS，允许 http://localhost:5173 访问所有
  /api/** 接口；生产环境 Vercel 域名在 Step 20 部署时补充
- 除 /api/auth/** 和 /api/health 外，所有接口需要登录才能访问
- 所有错误响应统一格式：`{"error": "message"}`
**Validation:** 用 Postman 测试：正确密码返回 200 且 Set-Cookie 存在；
错误密码返回 401；登出后再访问受保护接口返回 401；
GET /api/auth/me 登录状态返回 200，未登录返回 401

---

### Step 5: 前端登录页
**Goal:** 实现登录表单，登录成功跳转主页
**Instructions:**
- 创建 LoginPage 组件：用户名输入框、密码输入框、登录按钮
- 调用 POST /api/auth/login，成功后跳转到主页
- 失败显示错误提示"用户名或密码错误"
- 用 React Router 实现路由：/ 是主页，/login 是登录页
- 页面加载时调用 GET /api/auth/me 检测登录状态：200 则留在当前页，401 则跳转 /login
- 未登录访问主页时自动跳转 /login
- Tailwind CSS 样式，Mobile First 布局
**Validation:** 输入正确密码跳转主页；错误密码显示错误提示；
直接访问主页未登录时跳转登录页

---

## Phase 3: 数据模型

### Step 6: 创建数据库表
**Goal:** 创建 Category 和 Transaction 两张表
**Instructions:**
- 用 JPA Entity 定义 Category：id、name、is_system
- 用 JPA Entity 定义 Transaction：id、amount、date、merchant_name、
  category_id、note、is_income、is_manual、category_modified_by_user、
  source_hash、created_at、updated_at
- 配置 spring.jpa.hibernate.ddl-auto=update，启动时自动建表
- 写 CategoryRepository 和 TransactionRepository
**Validation:** 启动项目后用数据库客户端（如 DBeaver）确认两张表已创建，
字段与数据模型一致

---

### Step 7: 预设分类数据
**Goal:** 系统启动时自动插入预设分类
**Instructions:**
- 写一个 DataInitializer（实现 ApplicationRunner）
- 检查 Category 表是否已有 is_system=true 的数据，没有则插入：
  餐饮、购物、交通、娱乐、账单/水电、医疗、旅行、收入、其他
- 确保每次启动不重复插入
**Validation:** 首次启动后查询 Category 表，确认 9 条预设分类存在；
重启后数量不变

---

## Phase 4: 分类接口

### Step 8: 分类 API
**Goal:** 实现获取分类列表和新增自定义分类接口
**Instructions:**
- 实现 GET /api/categories：返回所有分类（系统预设 + 用户自定义）
- 实现 POST /api/categories：新增自定义分类，name 不能为空，
  is_system 固定为 false
- 分类名重复时返回 400 错误
**Validation:** Postman 测试 GET 返回 9 条预设分类；
POST 新增一条后 GET 返回 10 条；重复名称返回 400

---

## Phase 5: CSV 导入

### Step 9: 后端 CSV 解析与导入
**Goal:** 接收 BOA CSV 文件，解析后存入数据库
**Instructions:**
- 实现 POST /api/transactions/import，接收 multipart/form-data 文件
- 用 Apache Commons CSV 解析 BOA CSV 格式
- BOA CSV 列名：Posted Date, Reference Number, Payee, Address, Amount
- 字段映射：
  - Posted Date → date
  - Amount → amount
  - Payee → merchant_name
  - Reference Number → source_hash（存原始值，不做哈希）
- Posted Date 为空的 pending 交易直接跳过不导入
- 金额处理：负数为支出，正数为收入，存入时统一转为正数，
  用 is_income 字段区分
- 自动分类：根据 Payee 关键词匹配预设分类（大小写不敏感），
  无匹配归为"其他"，category_modified_by_user=false
- 关键词映射表：
  | 分类 | 关键词 |
  |------|------|
  | 交通 | UBER, LYFT, CLIPPER, BART |
  | 餐饮 | STARBUCKS, SAFEWAY, WHOLEFDS, TRADER JOE, TACO BELL, CHIPOTLE, MCDONALD |
  | 购物 | AMAZON, AMAZON MKTPL, WALMART, TARGET |
  | 娱乐 | NETFLIX, SPOTIFY, OPENAI, CLAUDE, APPLE, GOOGLE |
  | 医疗 | HEADWAY, TALKIATRY |
  | 旅行 | DELTA, AMERICAN AIR, UNITED, SOUTHWEST |
  | 账单/水电 | PG&E, COMCAST, ATT, VERIZON |
  | 收入 | PAYROLL, DIRECT DEP, ZELLE, VENMO, TRANSFER FROM |
  | 其他 | 无法匹配时归入 |
- 去重：Reference Number 已存在于 source_hash 则跳过
- 返回：成功导入 N 条，跳过重复 N 条，跳过 pending N 条
**Validation:** 上传真实 BOA CSV，返回导入数量；
再次上传同一文件，返回跳过数量等于第一次导入数量；
数据库中记录分类已自动打标签；Posted Date 为空的行未被导入

---

### Step 10: 前端 CSV 上传页面
**Goal:** 实现文件上传 UI
**Instructions:**
- 在主页创建"导入 CSV"入口
- 点击后显示文件选择器，只接受 .csv 文件
- 上传后显示 loading 状态
- 完成后显示结果："成功导入 N 条，跳过重复 N 条，跳过 pending N 条"
- 失败时显示错误信息
**Validation:** 上传 BOA CSV 后页面显示导入结果；
上传非 CSV 文件时被拒绝或提示错误

---

## Phase 6: 交易记录

### Step 11: 交易列表 API
**Goal:** 实现按月查询交易记录接口
**Instructions:**
- 实现 GET /api/transactions?year=2026&month=4
- 返回该月所有交易，按日期倒序排列
- 每条记录包含：id、amount、date、merchant_name、
  category（name）、note、is_income、is_manual
**Validation:** Postman 查询有数据的月份返回正确记录；
查询无数据的月份返回空数组

---

### Step 12: 手动添加 / 编辑 / 删除交易 API
**Goal:** 实现交易记录的增删改接口
**Instructions:**
- 实现 POST /api/transactions：手动添加，字段：amount（始终为正数）、date、
  category_id、note、is_income（布尔值，前端 toggle 传入），is_manual=true
- 实现 PUT /api/transactions/{id}：可编辑 amount、category_id、note、is_income；
  编辑 category_id 时将 category_modified_by_user 设为 true
- 实现 DELETE /api/transactions/{id}：只允许删除 is_manual=true 的记录，
  尝试删除 CSV 导入记录返回 403 + `{"error": "CSV导入的记录不可删除"}`
- 金额不能为 0 或负数，否则返回 400 + `{"error": "金额必须为正数"}`
**Validation:** Postman 测试手动添加后出现在列表；
编辑后字段更新；删除手动添加的成功；删除 CSV 导入的返回 403

---

### Step 13: 前端交易列表页
**Goal:** 显示当月交易列表，支持月份切换
**Instructions:**
- 主页核心区域显示交易列表
- 顶部有月份选择器（上一月 / 下一月箭头）
- 每条记录显示：日期、商家名、金额、分类、备注
- 手动添加的记录有小标识（如"手动"标签）
- 收入记录金额显示绿色，支出显示红色
- 移动端友好的列表布局
**Validation:** 切换月份后列表更新；收支颜色区分正确；
手动添加的记录有标识

---

### Step 14: 前端编辑 / 添加 / 删除交互
**Goal:** 实现交易记录的增删改 UI
**Instructions:**
- 点击列表中任意一条记录，弹出 Modal 编辑弹窗
- 编辑 Modal 显示当前值，可修改：金额、分类（下拉选择）、备注、收入/支出 toggle
- 保存后列表实时更新
- 手动添加的记录显示删除按钮，点击后确认删除
- 页面有"+ 添加记录"按钮，点击弹出添加 Modal
- 添加 Modal 字段：金额（正数）、日期、分类（下拉）、备注、收入/支出 toggle
**Validation:** 编辑分类后列表显示新分类；
删除手动记录后消失；添加新记录后出现在列表

---

## Phase 7: 统计与图表

### Step 15: 收支总览 API
**Goal:** 实现按月收支汇总接口
**Instructions:**
- 实现 GET /api/summary?year=2026&month=4
- 返回：total_income（总收入）、total_expense（总支出）、
  balance（结余 = 收入 - 支出）
- 数字精确到小数点后两位
**Validation:** Postman 查询有数据的月份，返回数字与手动加总交易列表一致

---

### Step 16: 分类统计 API
**Goal:** 实现按月分类支出汇总接口
**Instructions:**
- 实现 GET /api/summary/categories?year=2026&month=4
- 只统计支出（is_income=false）
- 返回每个分类的名称和总金额，按金额降序
- 无支出的分类不返回
**Validation:** 返回数据中各分类金额加总等于 total_expense

---

### Step 17: 前端收支总览与图表
**Goal:** 实现主页顶部总览卡片和图表区域
**Instructions:**
- 主页顶部显示三张卡片：总收入、总支出、结余
- 结余为正显示绿色，为负显示红色
- 图表区域包含两个 tab：饼图 / 柱状图
- 饼图：各分类支出占比，用 Recharts PieChart
- 柱状图：各分类支出金额，用 Recharts BarChart
- 月份切换后总览和图表同步更新
- 当月无数据时显示空状态提示文字，不显示空图表
**Validation:** 数字与 API 返回一致；切换月份图表正确更新；
无数据时显示提示而非空图表

---

## Phase 8: 收尾

### Step 18: 响应式检查与样式完善
**Goal:** 确保手机和电脑端体验都正常
**Instructions:**
- 用浏览器 DevTools 模拟 iPhone 14 尺寸检查所有页面
- 修复任何在手机上溢出、重叠、点击区域过小的问题
- 确认所有按钮在移动端足够大（至少 44px 高度）
- 确认图表在手机上可读
**Validation:** iPhone 14 尺寸下所有功能可正常操作，无布局问题

---

### Step 19: 部署后端到 Railway
**Goal:** 将 Spring Boot 应用部署到 Railway
**Instructions:**
- 在 Railway 创建项目，添加 PostgreSQL 插件
- 将 Spring Boot 连接到 Railway 提供的 PostgreSQL URL
- 将环境变量（APP_USERNAME、APP_PASSWORD、DATABASE_URL）
  配置到 Railway 的环境变量面板
- 推送代码到 GitHub，Railway 自动部署
- 确认生产环境数据库表自动创建，预设分类自动插入
**Validation:** Railway 部署成功，访问 Railway 提供的域名 /api/health 返回 "ok"

---

### Step 20: 部署前端到 Vercel
**Goal:** 将 React 应用部署到 Vercel
**Instructions:**
- 将前端 Axios baseURL 改为 Railway 后端域名
- 在 Spring Boot CORS 配置里补充 Vercel 生产域名
- 在 Vercel 导入 GitHub 仓库
- 配置环境变量：VITE_API_BASE_URL 指向 Railway 域名
- 部署后测试登录、CSV 导入、编辑、图表全流程
**Validation:** 手机浏览器访问 Vercel 域名，完整走通所有功能

---

### Step 21: 端到端功能验收
**Goal:** 用真实 BOA CSV 数据完整验收所有功能
**Instructions:**
- 从 BOA 网站下载最近 3 个月的真实 CSV
- 上传到生产环境，确认导入条数合理
- 检查自动分类准确率，手动修正几条
- 手动添加一条现金消费
- 编辑一条 AA 制消费金额
- 查看图表，确认数字与预期一致
- 在手机和电脑上各完整操作一遍
**Validation:** 所有 Acceptance Criteria 全部通过