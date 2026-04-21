# Phase 1 验证指南

## 前置条件

确保你电脑上有 3 个终端窗口可用（Terminal 1、2、3）。

---

## 第一步：启动 PostgreSQL 数据库（Terminal 1）

```bash
cd ~/Desktop/seekJOB/proj/billingbook
docker compose up -d
```

**验证：** 运行以下命令，应该看到容器状态为 `running`：

```bash
docker ps
```

预期输出类似：
```
CONTAINER ID   IMAGE         ...   STATUS          PORTS                    NAMES
xxxxxxxxxxxx   postgres:16   ...   Up X seconds    0.0.0.0:5433->5432/tcp   billingbook-db
```

> 注意端口是 `5433->5432`，不是 5432（因为你本机已有 PostgreSQL 占用了 5432）。

---

## 第二步：启动后端 Spring Boot（Terminal 2）

```bash
cd ~/Desktop/seekJOB/proj/billingbook/backend
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
./mvnw spring-boot:run
```

**等待直到看到这行日志（说明启动成功）：**
```
Started BillingbookApplication in X.XXX seconds
```

**验证 1 — Health 端点：**

打开浏览器，访问：
```
http://localhost:8080/api/health
```

页面应该只显示：
```
ok
```

**验证 2 — 数据库连接：**

回看 Terminal 2 的日志，确认有这行（说明 HikariPool 连接池启动成功）：
```
HikariPool-1 - Start completed.
```

**验证 3 — 没有 FATAL 错误：**

在日志中搜索，确认**没有**出现以下错误：
```
FATAL: role "billingbook" does not exist
```
如果有这个错误，说明连到了错误的数据库（本机自带的 PG 而非 Docker 的），需要排查。

> 验证完成后，**不要关闭 Terminal 2**，后端需要保持运行。

---

## 第三步：启动前端 Vite 开发服务器（Terminal 3）

```bash
cd ~/Desktop/seekJOB/proj/billingbook/frontend
npm run dev
```

**等待直到看到：**
```
VITE vX.X.X  ready in XXX ms

➜  Local:   http://localhost:5173/
```

**验证 1 — 页面显示：**

打开浏览器，访问：
```
http://localhost:5173
```

页面正中间应该显示大字：
```
Dollary
```

**验证 2 — 控制台无报错：**

1. 在浏览器页面按 `F12`（或 `Cmd+Option+I`）打开开发者工具
2. 点击顶部 **Console** 标签
3. 确认没有红色错误信息（红色的 `ERR_CONNECTION_REFUSED` 等都不应出现）

> 黄色的 warnings 可以忽略，红色的 errors 必须为 0。

---

## 验证结果汇总

| 检查项 | 预期结果 | 实际结果 |
|--------|---------|---------|
| `docker ps` 容器状态 | running，端口 5433 | |
| `localhost:8080/api/health` | 页面显示 "ok" | |
| 后端日志 HikariPool | `Start completed.` | |
| 后端日志无 FATAL | 没有 role does not exist 错误 | |
| `localhost:5173` 页面 | 显示 "Dollary" | |
| 浏览器 Console | 无红色错误 | |

全部通过即 Phase 1 验证完成。请告诉我每项的实际结果。

---

# Phase 2 验证指南

## 前置条件

Phase 1 已全部通过。确保 PostgreSQL 容器在运行（Terminal 1）。

---

## 第一步：启动后端（Terminal 2）

```bash
cd ~/Desktop/seekJOB/proj/billingbook/backend
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
./mvnw spring-boot:run
```

**等待启动完成**（看到 `Started BillingbookApplication`）。

---

## 第二步：启动前端（Terminal 3）

```bash
cd ~/Desktop/seekJOB/proj/billingbook/frontend
npm run dev
```

**等待看到** `Local: http://localhost:5173/`

---

## 第三步：测试后端 Auth 接口（用 curl 或 Postman）

### 3.1 未登录访问 /me（应返回 401）

```bash
curl -s -w "\nHTTP %{http_code}\n" http://localhost:8080/api/auth/me
```

**预期：**
```json
{"error":"未登录"}
HTTP 401
```

### 3.2 错误密码登录（应返回 401）

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}'
```

**预期：**
```json
{"error":"用户名或密码错误"}
HTTP 401
```

### 3.3 正确密码登录（应返回 200 + Set-Cookie）

```bash
curl -s -v -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt \
  -d '{"username":"admin","password":"admin123"}' 2>&1 | grep -E "Set-Cookie|HTTP/1"
```

**预期：**
- HTTP/1.1 200
- Set-Cookie 包含 `JSESSIONID` 且标记 `HttpOnly`

### 3.4 携带 Cookie 访问 /me（应返回 200）

```bash
curl -s -b /tmp/cookies.txt http://localhost:8080/api/auth/me
```

**预期：**
```json
{"authenticated":true}
```

### 3.5 登出后访问 /me（应返回 401）

```bash
curl -s -b /tmp/cookies.txt -c /tmp/cookies.txt -X POST http://localhost:8080/api/auth/logout
curl -s -w "\nHTTP %{http_code}\n" -b /tmp/cookies.txt http://localhost:8080/api/auth/me
```

**预期：**
```json
{"message":"已登出"}
{"error":"未登录"}
HTTP 401
```

---

## 第四步：测试前端登录页面（浏览器）

### 4.1 未登录自动跳转

1. 打开浏览器，访问 `http://localhost:5173`
2. **预期：** 自动跳转到 `/login` 页面
3. 页面显示登录表单（Username + Password 输入框 + Sign In 按钮）

### 4.2 错误密码显示错误提示

1. 输入任意用户名和错误密码
2. 点击 Sign In
3. **预期：** 表单上方出现红色错误提示："用户名或密码错误"

### 4.3 正确密码登录跳转主页

1. 输入用户名 `admin`，密码 `admin123`
2. 点击 Sign In
3. **预期：** 跳转到主页 `/`，显示 "Dollary" 标题和空状态提示
4. 右上角显示 "Sign Out" 按钮

### 4.4 登出后跳转回登录页

1. 点击右上角 "Sign Out"
2. **预期：** 跳转回 `/login` 页面

### 4.5 登录状态刷新保持

1. 用正确密码登录
2. 刷新页面（Cmd+R）
3. **预期：** 仍然停留在主页，不会跳转到登录页

---

## 验证结果汇总

| 检查项 | 预期结果 | 实际结果 |
|--------|---------|---------|
| 未登录 /api/auth/me | 401 + `{"error":"未登录"}` | |
| 错误密码 /api/auth/login | 401 + `{"error":"用户名或密码错误"}` | |
| 正确密码 /api/auth/login | 200 + Set-Cookie HttpOnly | |
| 携 Cookie /api/auth/me | 200 + `{"authenticated":true}` | |
| 登出后 /api/auth/me | 401 | |
| 访问 localhost:5173 | 自动跳转到 /login | |
| 错误密码前端 | 显示红色错误提示 | |
| 正确密码前端 | 跳转主页，显示空状态 | |
| Sign Out 按钮 | 登出并跳转 /login | |
| 刷新页面 | 保持登录状态 | |
| 浏览器 Console | 无红色错误 | |

全部通过即 Phase 2 验证完成。请告诉我每项的实际结果。

---

# Phase 3 验证指南

## 前置条件

Phase 2 已全部通过。确保 PostgreSQL 容器在运行（Terminal 1）。

---

## 第一步：启动后端（Terminal 2）

```bash
cd ~/Desktop/seekJOB/proj/Dollary/backend
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
./mvnw spring-boot:run
```

**等待启动完成**（看到 `Started BillingbookApplication`）。

---

## 第二步：验证数据库表已创建

```bash
docker exec billingbook-db psql -U billingbook -d billingbook -c "\dt"
```

**预期：** 输出包含 `categories` 和 `transactions` 两张表：

```
 Schema |     Name     | Type  |    Owner
--------+--------------+-------+-------------
 public | categories   | table | billingbook
 public | transactions | table | billingbook
```

---

## 第三步：验证 categories 表结构

```bash
docker exec billingbook-db psql -U billingbook -d billingbook -c "\d categories"
```

**预期：** 包含三列：

| Column   | Type    | Nullable |
|----------|---------|----------|
| id       | uuid    | not null |
| name     | varchar | not null |
| is_system| boolean | not null |

---

## 第四步：验证 transactions 表结构

```bash
docker exec billingbook-db psql -U billingbook -d billingbook -c "\d transactions"
```

**预期：** 包含以下列（12 列）：

- `id` (uuid, not null)
- `amount` (numeric(12,2), not null)
- `transaction_date` (date, not null)
- `merchant_name` (varchar, not null)
- `category_id` (uuid, not null) — FK → categories(id)
- `note` (varchar, nullable)
- `is_income` (boolean, not null)
- `is_manual` (boolean, not null)
- `category_modified_by_user` (boolean, not null)
- `source_hash` (varchar, nullable, **unique**)
- `created_at` (timestamptz, not null)
- `updated_at` (timestamptz, not null)

确认 `source_hash` 有 UNIQUE 约束，`category_id` 有 FOREIGN KEY 约束指向 `categories(id)`。

---

## 第五步：验证预设分类数据

```bash
docker exec billingbook-db psql -U billingbook -d billingbook -c "SELECT name, is_system FROM categories ORDER BY name;"
```

**预期：** 9 条记录，全部 `is_system = t`：

```
   name    | is_system
-----------+-----------
 交通      | t
 其他      | t
 医疗      | t
 娱乐      | t
 收入      | t
 旅行      | t
 账单/水电 | t
 购物      | t
 餐饮      | t
```

---

## 第六步：验证重启不重复插入

1. 在 Terminal 2 停止 Spring Boot（Ctrl+C）
2. 重新启动：

```bash
./mvnw spring-boot:run
```

3. 等待启动完成后再次查询：

```bash
docker exec billingbook-db psql -U billingbook -d billingbook -c "SELECT COUNT(*) FROM categories;"
```

**预期：** `count = 9`（与首次启动一致，无重复）。

---

## 验证结果汇总

| 检查项 | 预期结果 | 实际结果 |
|--------|---------|---------|
| `\dt` 表列表 | categories + transactions | |
| categories 列 | id (uuid), name (varchar), is_system (boolean) | |
| transactions 列 | 12 列，含 FK + unique source_hash | |
| source_hash 约束 | UNIQUE | |
| category_id 约束 | FK → categories(id) | |
| 预设分类数量 | 9 条，is_system = t | |
| 重启后分类数量 | 仍为 9（无重复） | |

全部通过即 Phase 3 验证完成。请告诉我每项的实际结果。

---

# Phase 4 验证指南

## 前置条件

Phase 3 已全部通过。确保 PostgreSQL 容器在运行（Terminal 1）。

---

## 第一步：启动后端（Terminal 2）

```bash
cd ~/Desktop/seekJOB/proj/Dollary/backend
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
./mvnw spring-boot:run
```

**等待启动完成**（看到 `Started BillingbookApplication`）。

---

## 第二步：登录获取 Session Cookie

```bash
curl -s -c /tmp/cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**预期：**
```json
{"message":"登录成功"}
```

---

## 第三步：测试 GET /api/categories（应返回 9 条预设分类）

```bash
curl -s -b /tmp/cookies.txt http://localhost:8080/api/categories | python3 -m json.tool
```

**预期：** 返回 JSON 数组，包含 9 条记录，每条有 `id`、`name`、`system` 字段，全部 `system = true`。

---

## 第四步：测试 POST /api/categories（新增自定义分类）

```bash
curl -s -b /tmp/cookies.txt -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"教育"}' | python3 -m json.tool
```

**预期：** 返回 201，JSON 包含新分类，`system = false`：
```json
{
    "id": "...",
    "name": "教育",
    "system": false
}
```

---

## 第五步：再次 GET 确认数量变为 10

```bash
curl -s -b /tmp/cookies.txt http://localhost:8080/api/categories | python3 -c "import sys,json; print(len(json.load(sys.stdin)))"
```

**预期：** 输出 `10`。

---

## 第六步：测试重复名称（应返回 400）

```bash
curl -s -w "\nHTTP %{http_code}\n" -b /tmp/cookies.txt -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"教育"}'
```

**预期：**
```json
{"error":"分类名称已存在"}
HTTP 400
```

---

## 第七步：测试空名称（应返回 400）

```bash
curl -s -w "\nHTTP %{http_code}\n" -b /tmp/cookies.txt -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":""}'
```

**预期：**
```json
{"error":"分类名称不能为空"}
HTTP 400
```

---

## 第八步：测试未登录访问（应返回 401）

```bash
curl -s -w "\nHTTP %{http_code}\n" http://localhost:8080/api/categories
```

**预期：**
```json
{"error":"未登录"}
HTTP 401
```

---

## 验证结果汇总

| 检查项 | 预期结果 | 实际结果 |
|--------|---------|---------|
| GET /api/categories | 9 条预设分类 | |
| POST /api/categories (新分类) | 201 + system=false | |
| GET 再次查询 | 10 条 | |
| POST 重复名称 | 400 + "分类名称已存在" | |
| POST 空名称 | 400 + "分类名称不能为空" | |
| 未登录 GET | 401 | |
| 未登录 POST | 401 | |

全部通过即 Phase 4 验证完成。请告诉我每项的实际结果。

---

# Phase 5 验证指南

## 前置条件

Phase 4 已全部通过。确保 PostgreSQL 容器在运行（Terminal 1）。

---

## 第一步：启动后端（Terminal 2）

```bash
cd ~/Desktop/seekJOB/proj/Dollary/backend
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
./mvnw spring-boot:run
```

**等待启动完成**（看到 `Started BillingbookApplication`）。

---

## 第二步：启动前端（Terminal 3）

```bash
cd ~/Desktop/seekJOB/proj/Dollary/frontend
npm run dev
```

**等待看到** `Local: http://localhost:5173/`

---

## 第三步：登录获取 Session Cookie

```bash
curl -s -c /tmp/cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**预期：**
```json
{"message":"登录成功"}
```

---

## 第四步：创建测试 CSV 文件

```bash
cat > /tmp/test_boa.csv << 'EOF'
Posted Date,Reference Number,Payee,Address,Amount
01/15/2026,REF001,STARBUCKS #1234 SAN FRANCISCO CA,123 MARKET ST,-5.75
01/16/2026,REF002,UBER *TRIP HELP.UBER.COM,,-12.30
01/17/2026,REF003,AMAZON MKTPL AMZ*ORDER123,,-29.99
01/18/2026,REF004,PAYROLL YOURCOMPANY,,2500.00
01/19/2026,REF005,NETFLIX.COM NETFLIX.COM CA,,-15.99
,REF006,PENDING TRANSACTION SOMEWHERE,,-50.00
EOF
```

> 注意最后一行 `Posted Date` 为空，模拟 pending 交易，应被跳过。

---

## 第五步：测试 CSV 导入（首次上传）

```bash
curl -s -b /tmp/cookies.txt -X POST http://localhost:8080/api/transactions/import \
  -F "file=@/tmp/test_boa.csv" | python3 -m json.tool
```

**预期：**
```json
{
    "imported": 5,
    "skippedDuplicate": 0,
    "skippedPending": 1
}
```

验证：
- 5 条成功导入（Posted Date 非空的行）
- 1 条 pending 被跳过（Posted Date 为空的行）
- 0 条重复跳过（首次上传）

---

## 第六步：验证数据库中的交易记录

```bash
docker exec billingbook-db psql -U billingbook -d billingbook -c \
  "SELECT t.transaction_date, t.merchant_name, t.amount, t.is_income, c.name as category, t.source_hash FROM transactions t JOIN categories c ON t.category_id = c.id ORDER BY t.transaction_date;"
```

**预期：**

| date       | merchant_name                          | amount | is_income | category  | source_hash |
|------------|----------------------------------------|--------|-----------|-----------|-------------|
| 2026-01-15 | STARBUCKS #1234 SAN FRANCISCO CA       |   5.75 | f         | 餐饮      | REF001      |
| 2026-01-16 | UBER *TRIP HELP.UBER.COM               |  12.30 | f         | 交通      | REF002      |
| 2026-01-17 | AMAZON MKTPL AMZ*ORDER123             |  29.99 | f         | 购物      | REF003      |
| 2026-01-18 | PAYROLL YOURCOMPANY                    |2500.00 | t         | 收入      | REF004      |
| 2026-01-19 | NETFLIX.COM NETFLIX.COM CA            |  15.99 | f         | 娱乐      | REF005      |

验证：
- 所有金额为正数（支出取了绝对值）
- `is_income` 正确区分收入/支出
- 分类自动匹配正确（STARBUCKS→餐饮, UBER→交通, AMAZON→购物, PAYROLL→收入, NETFLIX→娱乐）

---

## 第七步：测试重复导入（去重）

```bash
curl -s -b /tmp/cookies.txt -X POST http://localhost:8080/api/transactions/import \
  -F "file=@/tmp/test_boa.csv" | python3 -m json.tool
```

**预期：**
```json
{
    "imported": 0,
    "skippedDuplicate": 5,
    "skippedPending": 1
}
```

验证：5 条记录因 Reference Number 重复被跳过，数据库总记录数不变。

---

## 第八步：验证数据库记录总数不变

```bash
docker exec billingbook-db psql -U billingbook -d billingbook -c "SELECT COUNT(*) FROM transactions;"
```

**预期：** `count = 5`（与首次上传后一致，没有新增重复记录）。

---

## 第九步：测试上传空文件（应返回 400）

```bash
curl -s -w "\nHTTP %{http_code}\n" -b /tmp/cookies.txt -X POST http://localhost:8080/api/transactions/import \
  -F "file=@/dev/null;filename=empty.csv"
```

**预期：**
```json
{"error":"文件不能为空"}
HTTP 400
```

---

## 第十步：测试上传非 CSV 文件（应返回 400）

```bash
echo "not a csv" > /tmp/test.txt
curl -s -w "\nHTTP %{http_code}\n" -b /tmp/cookies.txt -X POST http://localhost:8080/api/transactions/import \
  -F "file=@/tmp/test.txt" | cat
```

**预期：**
```json
{"error":"仅支持 CSV 文件"}
HTTP 400
```

---

## 第十一步：测试未登录导入（应返回 401）

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8080/api/transactions/import \
  -F "file=@/tmp/test_boa.csv"
```

**预期：**
```json
{"error":"未登录"}
HTTP 401
```

---

## 第十二步：测试前端 CSV 上传（浏览器）

1. 打开浏览器，访问 `http://localhost:5173`
2. 用 `admin` / `admin123` 登录
3. **预期：** 主页空状态区域显示 "Import BOA CSV" 按钮
4. 点击 "Import BOA CSV"，选择 `/tmp/test_boa.csv`
5. **预期：** 按钮变为 "Importing..." 状态
6. **预期：** 完成后显示绿色结果框："Imported: 0 transactions" + "Skipped (duplicate): 5" + "Skipped (pending): 1"（因为后端已导入过）
7. 再次上传同一文件，确认结果一致

---

## 第十三步：测试前端错误提示

1. 创建一个空文件并命名为 `.csv`：
   ```bash
   touch /tmp/empty.csv
   ```
2. 在前端选择 `/tmp/empty.csv` 上传
3. **预期：** 显示红色错误提示："文件不能为空"

---

## 验证结果汇总

| 检查项 | 预期结果 | 实际结果 |
|--------|---------|---------|
| 首次 CSV 导入 | imported=5, skippedPending=1 | |
| 数据库记录 | 5 条，分类正确匹配 | |
| 金额处理 | 全部正数，is_income 正确 | |
| 重复导入 | imported=0, skippedDuplicate=5 | |
| 重复后总数 | 仍为 5 | |
| 空文件上传 | 400 + "文件不能为空" | |
| 非 CSV 上传 | 400 + "仅支持 CSV 文件" | |
| 未登录导入 | 401 | |
| 前端上传按钮 | 显示 "Import BOA CSV" | |
| 前端上传流程 | loading → 结果显示 | |
| 前端错误提示 | 红色错误框 | |

全部通过即 Phase 5 验证完成。请告诉我每项的实际结果。

---

# Phase 6 验证指南

## 前置条件

Phase 5 已全部通过。数据库中已有 Phase 5 导入的交易记录（4 月份数据）。确保 PostgreSQL 容器在运行。

---

## 第一步：启动后端（Terminal 2）

```bash
cd ~/Desktop/seekJOB/proj/Dollary/backend
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
./mvnw spring-boot:run
```

**等待启动完成**（看到 `Started BillingbookApplication`）。

---

## 第二步：启动前端（Terminal 3）

```bash
cd ~/Desktop/seekJOB/proj/Dollary/frontend
npm run dev
```

**等待看到** `Local: http://localhost:5173/`

---

## 第三步：后端 API 测试 — 交易列表（curl）

### 3.1 登录

```bash
curl -s -c /tmp/cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**预期：**
```json
{"message":"登录成功"}
```

### 3.2 查询有数据的月份

```bash
curl -s -b /tmp/cookies.txt "http://localhost:8080/api/transactions?year=2026&month=4" | python3 -m json.tool | head -25
```

**预期：** 返回 JSON 数组，每个对象包含 `id`、`amount`、`date`、`merchantName`、`categoryName`、`categoryId`、`note`、`isIncome`、`isManual`。记录按日期倒序排列（最新的在前）。

### 3.3 查询无数据的月份

```bash
curl -s -b /tmp/cookies.txt "http://localhost:8080/api/transactions?year=2025&month=1"
```

**预期：**
```json
[]
```

### 3.4 未登录访问（应返回 401）

```bash
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/transactions?year=2026&month=4"
```

**预期：** `401`

---

## 第四步：后端 API 测试 — 手动添加交易（curl）

### 4.1 获取分类 ID

```bash
curl -s -b /tmp/cookies.txt http://localhost:8080/api/categories | python3 -c "import sys,json; cats=json.load(sys.stdin); print([c['id'] for c in cats if c['name']=='餐饮'][0])"
```

记下输出的 UUID，下面用 `<CATEGORY_ID>` 代替。

### 4.2 创建手动支出

```bash
curl -s -b /tmp/cookies.txt -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -d "{\"amount\":25.50,\"date\":\"2026-04-15\",\"categoryId\":\"<CATEGORY_ID>\",\"note\":\"午餐\",\"isIncome\":false}" | python3 -m json.tool
```

**预期：** 返回 200，JSON 中：
- `isManual` = `true`
- `merchantName` = `"手动添加"`
- `isIncome` = `false`
- `amount` = `25.50`

记下返回的 `id`，下面用 `<MANUAL_TX_ID>` 代替。

### 4.3 创建手动收入

```bash
curl -s -b /tmp/cookies.txt -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -d "{\"amount\":100.00,\"date\":\"2026-04-20\",\"categoryId\":\"<CATEGORY_ID>\",\"note\":\"朋友还款\",\"isIncome\":true}" | python3 -m json.tool
```

**预期：** `isIncome` = `true`，`isManual` = `true`，`amount` = `100.00`。

记下返回的 `id`，下面用 `<MANUAL_TX_ID2>` 代替。

### 4.4 金额为零（应返回 400）

```bash
curl -s -w "\nHTTP %{http_code}\n" -b /tmp/cookies.txt -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -d "{\"amount\":0,\"date\":\"2026-04-15\",\"categoryId\":\"<CATEGORY_ID>\",\"isIncome\":false}"
```

**预期：**
```json
{"error":"金额必须为正数"}
HTTP 400
```

### 4.5 金额为负（应返回 400）

```bash
curl -s -w "\nHTTP %{http_code}\n" -b /tmp/cookies.txt -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -d "{\"amount\":-10,\"date\":\"2026-04-15\",\"categoryId\":\"<CATEGORY_ID>\",\"isIncome\":false}"
```

**预期：**
```json
{"error":"金额必须为正数"}
HTTP 400
```

---

## 第五步：后端 API 测试 — 编辑交易（curl）

### 5.1 编辑金额和备注

```bash
curl -s -b /tmp/cookies.txt -X PUT "http://localhost:8080/api/transactions/<MANUAL_TX_ID>" \
  -H "Content-Type: application/json" \
  -d '{"amount":15.00,"note":"edited note"}' | python3 -m json.tool
```

**预期：** `amount` = `15.00`，`note` = `"edited note"`，其他字段不变。

### 5.2 编辑分类（应触发 category_modified_by_user = true）

```bash
# 先获取另一个分类 ID
SHOPPING_ID=$(curl -s -b /tmp/cookies.txt http://localhost:8080/api/categories | python3 -c "import sys,json; cats=json.load(sys.stdin); print([c['id'] for c in cats if c['name']=='购物'][0])")

curl -s -b /tmp/cookies.txt -X PUT "http://localhost:8080/api/transactions/<MANUAL_TX_ID>" \
  -H "Content-Type: application/json" \
  -d "{\"categoryId\":\"$SHOPPING_ID\"}" | python3 -m json.tool
```

**预期：** `categoryName` 变为 `"购物"`。

验证数据库：
```bash
docker exec billingbook-db psql -U billingbook -d billingbook -c \
  "SELECT category_modified_by_user FROM transactions WHERE id = '<MANUAL_TX_ID>';"
```

**预期：** `category_modified_by_user` = `t`。

### 5.3 编辑不存在的交易（应返回 404）

```bash
curl -s -w "\nHTTP %{http_code}\n" -b /tmp/cookies.txt -X PUT "http://localhost:8080/api/transactions/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -d '{"amount":10}'
```

**预期：**
```json
{"error":"交易记录不存在"}
HTTP 404
```

---

## 第六步：后端 API 测试 — 删除交易（curl）

### 6.1 删除手动交易（应成功 200）

```bash
curl -s -o /dev/null -w "HTTP %{http_code}" -b /tmp/cookies.txt -X DELETE "http://localhost:8080/api/transactions/<MANUAL_TX_ID2>"
```

**预期：** `HTTP 200`

### 6.2 删除 CSV 导入的交易（应返回 403）

获取一条 CSV 导入记录的 ID：
```bash
CSV_TX_ID=$(curl -s -b /tmp/cookies.txt "http://localhost:8080/api/transactions?year=2026&month=4" | python3 -c "import sys,json; data=json.load(sys.stdin); print([t['id'] for t in data if not t['isManual']][0])")

curl -s -w "\nHTTP %{http_code}\n" -b /tmp/cookies.txt -X DELETE "http://localhost:8080/api/transactions/$CSV_TX_ID"
```

**预期：**
```json
{"error":"CSV导入的记录不可删除"}
HTTP 403
```

---

## 第七步：前端测试 — 交易列表显示（浏览器）

1. 打开浏览器，访问 `http://localhost:5173`
2. 用 `admin` / `admin123` 登录
3. **预期：** 主页显示交易列表（不再是 Phase 5 的空状态提示）
4. 列表顶部有月份选择器，显示当前月份格式如 `Apr 2026`
5. 点击 `←` 切换到上个月，点击 `→` 切换到下个月
6. **预期：** 切换到无数据月份时，列表区域显示 "No transactions this month." 空状态卡片
7. 切换回 2026 年 4 月，验证每条交易卡片显示：
   - 商家名称（粗体，左侧）
   - 日期、分类标签（蓝色小标签）、备注
   - 金额（右侧）：收入绿色 `+$XX.XX`，支出红色 `-$XX.XX`
8. 之前通过 curl 手动添加的记录（merchantName 为 "手动添加"）有橙色 `MANUAL` 标签

---

## 第八步：前端测试 — 添加交易（浏览器）

1. 点击主页上方蓝色 `+ Add Transaction` 按钮
2. **预期：** 弹出 Modal，标题 "ADD TRANSACTION"
3. 填写：
   - Amount: `42.50`
   - Date: 默认今天（可修改，日期选择器）
   - Category: 下拉选择一个分类
   - Note: `test manual add`
   - Type: 底部有 Expense / Income 切换按钮，选择 "Expense"（红色高亮）
4. 点击 "Save" 按钮
5. **预期：** Modal 关闭，列表刷新，新记录出现，带 `MANUAL` 标签，金额显示红色 `-$42.50`

---

## 第九步：前端测试 — 编辑交易（浏览器）

1. 点击列表中任意一条记录
2. **预期：** 弹出编辑 Modal，标题 "EDIT TRANSACTION"
3. 表单预填充当前值（编辑模式下不显示 Date 字段）
4. 修改 Amount 为 `10.00`，修改 Note 为 `edited`
5. 切换 Category 为其他分类
6. 点击 "Save"
7. **预期：** Modal 关闭，列表中该记录的金额、备注、分类标签已更新

---

## 第十步：前端测试 — 删除交易（浏览器）

### 10.1 删除手动添加的记录

1. 点击一条有 `MANUAL` 标签的记录
2. **预期：** Modal 底部有红色 "Delete Transaction" 按钮
3. 点击 "Delete Transaction"
4. **预期：** 弹出浏览器确认对话框 `Delete this transaction?`
5. 点击 "确定"（OK）
6. **预期：** Modal 关闭，记录从列表消失

### 10.2 CSV 导入的记录无删除按钮

1. 点击一条没有 `MANUAL` 标签的 CSV 导入记录
2. **预期：** Modal 底部 **没有** "Delete Transaction" 按钮

---

## 第十一步：前端测试 — UI 样式验证

### 11.1 背景

- 页面背景为暖灰色 `#E8E4DC`（不是纯白）

### 11.2 卡片和边框

- 所有交易卡片有 2px 实线深色边框
- 卡片有底部阴影（非 hover 时可见），点击时阴影压缩模拟按压

### 11.3 按钮 3D 效果

- 所有按钮有 2px 实线边框 + 底部阴影（约 3px）
- 按下时按钮下沉（`translate-y`）+ 阴影消失
- `+ Add Transaction` 蓝色背景 `#4A90D9`
- `Import CSV` 浅色背景 `#FDFAF4`

### 11.4 字体

- 打开 DevTools → Elements → 检查按钮或标题的 computed `font-family`
- **预期：** 包含 `IBM Plex Mono`

### 11.5 颜色

- 收入金额绿色
- 支出金额红色
- `MANUAL` 标签橙色
- 分类标签蓝色背景 + 蓝色文字

### 11.6 Modal

- Modal 有 2px 深色边框，背景 `#E8E4DC`
- Expense/Income 切换为分体按钮：Expense 红色高亮，Income 绿色高亮
- Cancel 按钮浅色，Save 按钮蓝色
- Delete 按钮（仅手动记录可见）红色边框 + 红色文字

### 11.7 浏览器 Console

- 按 F12 → Console，确认无红色错误

---

## 第十二步：前端测试 — CSV 导入仍然正常

1. 点击 `Import CSV` 按钮，上传之前用过的 `/tmp/test_boa.csv`
2. **预期：** 显示绿色结果横幅，内容为 "Imported: 0, Skipped (dup): 5, Skipped (pending): 1"（因为数据已存在）
3. 横幅有关闭按钮 `✕`，点击后横幅消失
4. 列表不受影响（无新记录）

---

## 验证结果汇总

| 检查项 | 预期结果 | 实际结果 |
|--------|---------|---------|
| GET /api/transactions（有数据） | 返回数组，按日期倒序 | |
| GET /api/transactions（无数据） | 返回空数组 `[]` | |
| GET /api/transactions（未登录） | 401 | |
| POST /api/transactions（支出） | 200，isManual=true，merchantName="手动添加" | |
| POST /api/transactions（收入） | 200，isIncome=true，amount=正数 | |
| POST /api/transactions（金额=0） | 400 `"金额必须为正数"` | |
| POST /api/transactions（金额<0） | 400 `"金额必须为正数"` | |
| PUT /api/transactions（编辑金额/备注） | 字段更新，返回最新值 | |
| PUT /api/transactions（改分类） | categoryName 更新，DB 中 category_modified_by_user=true | |
| PUT /api/transactions（不存在 ID） | 404 `"交易记录不存在"` | |
| DELETE /api/transactions（手动） | 200 成功 | |
| DELETE /api/transactions（CSV 导入） | 403 `"CSV导入的记录不可删除"` | |
| 前端：交易列表显示 | 卡片列表，日期倒序 | |
| 前端：月份选择器 | `←` `→` 箭头切换，标题更新 | |
| 前端：空月份 | 显示 "No transactions this month." | |
| 前端：收支颜色区分 | 收入绿色 `+$`，支出红色 `-$` | |
| 前端：MANUAL 标签 | 手动记录有橙色标签 | |
| 前端：分类标签 | 蓝色背景小标签显示分类名 | |
| 前端：添加交易 | Modal 弹出，保存后记录出现在列表 | |
| 前端：编辑交易 | Modal 预填值（无 Date 字段），保存后列表更新 | |
| 前端：删除手动记录 | 有 Delete 按钮，确认后记录消失 | |
| 前端：CSV 记录无 Delete | 编辑 Modal 无 Delete 按钮 | |
| UI：背景色 #E8E4DC | 暖灰色，非纯白 | |
| UI：卡片 2px 边框 + 阴影 | 深色边框，底部阴影，点击压缩 | |
| UI：按钮 3D 效果 | 边框 + 底部阴影，按下压缩 | |
| UI：IBM Plex Mono 字体 | 标题/标签/按钮为等宽字体 | |
| UI：Modal 收入/支出切换 | 红绿分体按钮 | |
| UI：Console 无错误 | 无红色错误 | |
| 前端：CSV 导入仍正常 | 上传后显示结果横幅，可关闭 | |

全部通过即 Phase 6 验证完成。请告诉我每项的实际结果。

---

# Phase 7 验证指南

## 前置条件

Phase 6 已全部通过。数据库中已有交易记录。确保 PostgreSQL 容器在运行。

---

## 第一步：启动后端（Terminal 2）

```bash
cd ~/Desktop/seekJOB/proj/Dollary/backend
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
./mvnw spring-boot:run
```

**等待启动完成**（看到 `Started BillingbookApplication`）。

---

## 第二步：启动前端（Terminal 3）

```bash
cd ~/Desktop/seekJOB/proj/Dollary/frontend
npm run dev
```

**等待看到** `Local: http://localhost:5173/`

---

## 第三步：后端 API 测试 — Summary API（curl）

### 3.1 登录

```bash
curl -s -c /tmp/cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**预期：**
```json
{"message":"登录成功"}
```

### 3.2 查询有数据月份的 Summary

```bash
curl -s -b /tmp/cookies.txt "http://localhost:8080/api/summary?year=2026&month=4" | python3 -m json.tool
```

**预期：** 返回 JSON 对象：
```json
{
    "totalIncome": <number>,
    "totalExpense": <number>,
    "balance": <number>
}
```

验证：
- `totalIncome` > 0（4 月有收入数据）
- `totalExpense` > 0（4 月有支出数据）
- `balance` = `totalIncome` - `totalExpense`
- 所有数字精确到小数点后两位

### 3.3 手动验证 balance 计算正确

```bash
echo "验证: balance = totalIncome - totalExpense"
curl -s -b /tmp/cookies.txt "http://localhost:8080/api/summary?year=2026&month=4" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Income:  {d[\"totalIncome\"]}')
print(f'Expense: {d[\"totalExpense\"]}')
print(f'Balance: {d[\"balance\"]}')
expected = round(d['totalIncome'] - d['totalExpense'], 2)
print(f'Expected balance: {expected}')
print(f'Match: {d[\"balance\"] == expected}')
"
```

**预期：** `Match: True`

### 3.4 查询空月份

```bash
curl -s -b /tmp/cookies.txt "http://localhost:8080/api/summary?year=2020&month=1"
```

**预期：**
```json
{"totalIncome":0,"totalExpense":0,"balance":0}
```

### 3.5 未登录访问（应返回 401）

```bash
curl -s "http://localhost:8080/api/summary?year=2026&month=4"
```

**预期：**
```json
{"error":"未登录"}
```

---

## 第四步：后端 API 测试 — Category Summary API（curl）

### 4.1 查询有数据月份的分类统计

```bash
curl -s -b /tmp/cookies.txt "http://localhost:8080/api/summary/categories?year=2026&month=4" | python3 -m json.tool
```

**预期：** 返回 JSON 数组，每个对象 `{ categoryName, totalAmount }`：
- 按金额降序排列
- 不包含收入分类（只有支出）
- 无消费的分类不出现

### 4.2 验证分类总和等于 totalExpense

```bash
curl -s -b /tmp/cookies.txt "http://localhost:8080/api/summary/categories?year=2026&month=4" | python3 -c "
import sys, json
cats = json.load(sys.stdin)
total = sum(c['totalAmount'] for c in cats)
print(f'Category sum: {total}')
for c in cats:
    print(f'  {c[\"categoryName\"]}: {c[\"totalAmount\"]}')
"
```

然后对比 Step 3.2 的 `totalExpense`，两者应该相等。

### 4.3 查询空月份

```bash
curl -s -b /tmp/cookies.txt "http://localhost:8080/api/summary/categories?year=2020&month=1"
```

**预期：**
```json
[]
```

### 4.4 未登录访问

```bash
curl -s "http://localhost:8080/api/summary/categories?year=2026&month=4"
```

**预期：**
```json
{"error":"未登录"}
```

---

## 第五步：前端测试 — Summary Cards（浏览器）

1. 打开浏览器，访问 `http://localhost:5173`
2. 用 `admin` / `admin123` 登录
3. **预期：** 交易列表上方出现三张并排卡片
4. 三张卡片分别显示：
   - **Income**（绿色数字，格式 `+$XX.XX`）
   - **Expense**（红色数字，格式 `-$XX.XX`）
   - **Balance**（正数绿色 `+$XX.XX`，负数红色 `-$XX.XX`）
5. 卡片有 Brutalist 风格：2px 深色边框、圆角、底部阴影
6. 标签文字为 IBM Plex Mono 等宽字体

---

## 第六步：前端测试 — Charts（浏览器）

1. 在 Summary Cards 下方，**预期：** 出现图表区域
2. 图表区域有两个 Tab 按钮："Pie Chart" 和 "Bar Chart"
3. 默认显示饼图（Pie Chart）：
   - 环形饼图，各分类用不同颜色显示
   - 鼠标悬停显示 tooltip（金额）
   - 标签显示分类名和百分比
4. 点击 "Bar Chart" tab：
   - 切换为水平柱状图
   - Y 轴为分类名，X 轴为金额
   - 每个柱子有不同颜色
   - 鼠标悬停显示 tooltip
5. 点击 "Pie Chart" tab 可切换回饼图

---

## 第七步：前端测试 — 月份切换同步

1. 点击月份选择器的 `←` 切换到上个月（无数据月份）
2. **预期：**
   - Summary Cards 显示 Income `$0.00`, Expense `$0.00`, Balance `$0.00`
   - 图表区域显示文字 "No expense data to chart this month."（不显示空图表）
   - 交易列表显示 "No transactions this month."
3. 切换回有数据的月份
4. **预期：** Summary Cards、Charts、Transaction List 全部恢复显示

---

## 第八步：前端测试 — 操作后 Summary 刷新

### 8.1 添加交易后刷新

1. 点击 `+ Add Transaction`，添加一笔支出（如 $50）
2. **预期：** Summary Cards 的 Expense 增加 $50，Balance 减少 $50
3. **预期：** Charts 中对应分类的金额增加

### 8.2 编辑交易后刷新

1. 点击刚添加的交易，编辑金额为 $30
2. **预期：** Summary Cards 和 Charts 实时更新

### 8.3 删除交易后刷新

1. 点击一条手动添加的交易，点击 Delete
2. **预期：** Summary Cards 和 Charts 实时更新

### 8.4 CSV 导入后刷新

1. 点击 `Import CSV`，上传 CSV 文件
2. **预期：** Summary Cards 和 Charts 实时更新

---

## 第九步：前端测试 — UI 样式验证

### 9.1 Summary Cards 样式

- 三张卡片等宽并排（grid-cols-3）
- 每张卡片有 2px 深色边框 `#2C2C2C`，圆角 `rounded-xl`
- 背景 `#FDFAF4`，底部阴影
- 标签文字 10px 大写，颜色 `#8B8680`
- 数字使用 IBM Plex Mono 字体

### 9.2 Charts 样式

- 图表容器有 2px 深色边框，圆角，底部阴影
- Tab 按钮有 3D 效果（边框 + 底部阴影）
- 选中 tab 深色背景，未选中浅色背景
- Tooltip 有深色边框和暖色背景
- 空状态文字居中，使用等宽字体

### 9.3 浏览器 Console

- 按 F12 → Console，确认无红色错误

---

## 验证结果汇总

| 检查项 | 预期结果 | 实际结果 |
|--------|---------|---------|
| GET /api/summary（有数据） | totalIncome, totalExpense, balance（2位小数） | |
| balance 计算正确 | balance = income - expense | |
| GET /api/summary（空月份） | 全部为 0 | |
| GET /api/summary（未登录） | 401 | |
| GET /api/summary/categories（有数据） | 按金额降序的分类数组 | |
| 分类总和 = totalExpense | 两者相等 | |
| GET /api/summary/categories（空月份） | `[]` | |
| GET /api/summary/categories（未登录） | 401 | |
| 前端：Summary Cards 显示 | Income/Expense/Balance 三张卡片 | |
| 前端：Income 绿色，Expense 红色 | 颜色正确 | |
| 前端：Balance 正绿负红 | 颜色随正负变化 | |
| 前端：Pie Chart 显示 | 环形图，分类标签+百分比 | |
| 前端：Bar Chart 显示 | 水平柱状图，分类名+金额 | |
| 前端：Tab 切换 | Pie/Bar 图表切换正常 | |
| 前端：空月份 | 显示 "No expense data" 文字 | |
| 前端：月份切换同步 | Cards + Charts + List 同步更新 | |
| 前端：添加后刷新 | Summary 和 Charts 更新 | |
| 前端：编辑后刷新 | Summary 和 Charts 更新 | |
| 前端：删除后刷新 | Summary 和 Charts 更新 | |
| 前端：导入后刷新 | Summary 和 Charts 更新 | |
| UI：Cards Brutalist 样式 | 2px 边框，阴影，等宽字体 | |
| UI：Charts Brutalist 样式 | 边框，3D tab 按钮，等宽 tooltip | |
| UI：Console 无错误 | 无红色错误 | |

全部通过即 Phase 7 验证完成。请告诉我每项的实际结果。
