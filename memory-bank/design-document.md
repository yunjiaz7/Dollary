# design-document.md — Dollary

## 1. Product Scope

### In Scope (MVP)
- BOA CSV 文件手动导入（解析交易记录）
- 手动添加交易记录
- 交易记录编辑（金额直接覆盖、分类修改、备注）
- 系统预设分类 + 用户自定义分类
- 自动分类打标签（基于商家名称关键词匹配）
- 本月收支总览（总收入、总支出、结余）
- 按分类饼图 + 柱状图
- 可切换查看不同月份数据
- 单用户登录（用户名密码，无注册）
- 响应式网页（Mobile First）

### Out of Scope (MVP 不做)
- Plaid 自动同步（下一阶段）
- 多用户 / 注册系统
- 预算提醒
- 多银行接入
- 导出报表

### 后续阶段规划
- 阶段二：接入 Plaid Development 环境，支持 BOA 自动同步
- 阶段三：支持其他银行

---

## 2. User Journeys

### Journey 1: 首次使用
1. 用户访问网页，看到登录页
2. 输入用户名 + 密码，进入主页
3. 主页显示空状态，提示"导入或添加第一笔交易"
4. 用户从 BOA 网站下载 CSV，上传到 app
5. 系统解析 CSV，自动打分类标签
6. 用户看到本月收支总览和图表

### Journey 2: 日常使用
1. 用户打开 APP，看到本月收支概览
2. 查看交易列表，点击某条记录编辑分类或备注
3. 手动添加一条现金消费
4. 切换到上个月查看历史数据

### Journey 3: 编辑 AA 制消费
1. 用户在列表看到一笔 $120 餐饮消费
2. 点击编辑，将金额改为 $40
3. 填写备注："AA 制，三人分摊"
4. 保存，列表和图表实时更新

---

## 3. Feature Behavior

### 3.1 登录
- 单用户模式，用户名密码存在服务器环境变量
- Session 有效期 7 天
- 无注册、无找回密码

### 3.2 CSV 导入
- 支持 BOA 标准 CSV 格式
- 解析字段：Posted Date、Amount、Payee、Reference Number
- Posted Date 为空的 pending 交易跳过不导入
- 用 Reference Number 做唯一标识去重，已存在则跳过
- 导入结果显示：成功 N 条，跳过重复 N 条，跳过 pending N 条

### 3.3 收入 / 支出判断
- 根据 BOA CSV 的金额正负自动判断
- 收入：Amount > 0（如工资、转账收入）
- 支出：Amount < 0（如消费、还款）
- 存入数据库时统一转为正数，用 is_income 字段区分

### 3.4 自动分类
- 系统预设分类：餐饮、购物、交通、娱乐、账单/水电、医疗、旅行、收入、其他
- 基于 Payee 关键词匹配（如 "UBER" → 交通，"STARBUCKS" → 餐饮）
- 无法匹配则归为"其他"
- 用户手动改过的分类不会被重新导入覆盖

### 3.5 交易记录编辑
- 可编辑：金额（直接覆盖）、分类、备注
- 不可编辑：日期、商家名称
- 编辑后统计和图表实时更新

### 3.6 手动添加交易
- 字段：金额（始终为正数）、日期、分类、备注、收入/支出切换（is_income toggle）
- 用户通过 toggle 自行选择"收入"或"支出"，金额始终输入正数
- 手动添加的记录有视觉标识
- 手动添加的可以删除，CSV 导入的不可删除

### 3.7 收支总览
- 当前选中月份：总收入、总支出、结余
- 结余 = 总收入 - 总支出
- 月份选择器切换历史月份

### 3.8 图表
- 饼图：当月各分类支出占比
- 柱状图：当月各分类支出金额
- 收入不参与分类图表，只在总览显示
- 切换月份后图表联动更新

### 3.9 UI Style: Brutalist / Tactile Tool UI

- Background: #E8E4DC sandy warm gray
- All cards and containers: 2px solid #2C2C2C border, 8-12px rounded corners
- Buttons: physical 3D appearance with bottom shadow, pressable feel
- Typography: JetBrains Mono / IBM Plex Mono for headings and labels
- Accent: blue #4A90D9 and orange #E8651A
- Reference aesthetic: Claude Code's own interface style

---

## 4. Edge Cases

### CSV 导入
- 格式不符合 BOA 标准：提示错误，拒绝导入
- Posted Date 为空（pending 交易）：跳过不导入
- Reference Number 已存在（重复导入）：跳过，计入跳过条数
- CSV 包含未来日期：正常导入，不做限制

### 编辑
- 金额改为 0 或负数：提示错误，不允许保存
- 用户手动修改过分类的记录：重新导入时不覆盖分类

### 数据展示
- 当月无数据：显示空状态，不显示空图表
- 某分类无消费：饼图不显示该分类

### 安全
- Plaid access token（未来阶段）必须加密存储，不可明文
- Session token 存 HttpOnly Cookie，防 XSS

---

## 5. Data Model

### Transaction
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| amount | Decimal | 金额（正数，覆盖后的值） |
| date | Date | 交易日期（Posted Date） |
| merchant_name | String | 商家名称（Payee） |
| category_id | FK | 分类 |
| note | String | 备注 |
| is_income | Boolean | 是否为收入 |
| is_manual | Boolean | 是否手动添加 |
| category_modified_by_user | Boolean | 用户是否手动改过分类，true 则导入时不覆盖 |
| source_hash | String | 去重用，存储 BOA CSV 的原始 Reference Number（非哈希）；手动添加为 null |
| created_at | Timestamp | 创建时间 |
| updated_at | Timestamp | 最后更新时间 |

### Category
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | String | 分类名称 |
| is_system | Boolean | 是否系统预设 |

### 前后端 API 边界（REST）
| 端点 | 方法 | 说明 |
|------|------|------|
| /api/auth/login | POST | 登录 |
| /api/auth/logout | POST | 登出，清除 Session Cookie |
| /api/auth/me | GET | 检测登录状态，已登录返回 200，未登录返回 401 |
| /api/transactions | GET | 查询交易列表（支持月份过滤） |
| /api/transactions | POST | 手动添加交易 |
| /api/transactions/{id} | PUT | 编辑交易 |
| /api/transactions/{id} | DELETE | 删除手动添加的交易 |
| /api/transactions/import | POST | 上传 CSV |
| /api/summary | GET | 收支总览（按月） |
| /api/categories | GET | 获取分类列表 |
| /api/categories | POST | 新增自定义分类 |

### CSV 格式
- BOA CSV 列名：Posted Date, Reference Number, Payee, Address, Amount
- 字段映射：
  - Posted Date → date
  - Amount → amount（负数为支出，正数为收入，存入时统一转正数）
  - Payee → merchant_name
  - Reference Number → source_hash（存原始值，不做哈希）

### 自动分类关键词映射
| 分类 | 关键词（Payee 中包含则匹配） |
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

### 错误响应格式
- 所有 API 错误统一返回：`{"error": "message"}`

---

## 6. Acceptance Criteria

| 功能 | 完成标准 |
|------|---------|
| 登录 | 正确密码可登录，错误密码被拒，7天内免登录 |
| CSV 导入 | 上传 BOA CSV 后交易出现在列表，重复导入不产生重复记录，pending 交易被跳过 |
| 自动分类 | 每条导入记录都有初始分类，不为空 |
| 编辑交易 | 修改后列表和图表立即更新 |
| 手动添加 | 四个字段保存后出现在列表和统计中 |
| 收支总览 | 数字与交易列表加总一致 |
| 图表 | 切换月份后正确更新 |
| 响应式 | 手机和电脑布局正常可操作 |