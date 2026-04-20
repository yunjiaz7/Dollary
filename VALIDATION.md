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
