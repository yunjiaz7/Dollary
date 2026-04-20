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
Personal Finance Tracker
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
| `localhost:5173` 页面 | 显示 "Personal Finance Tracker" | |
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
3. **预期：** 跳转到主页 `/`，显示 "Personal Finance Tracker" 标题和空状态提示
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
