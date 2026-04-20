# tech-stack.md — Dollary

## 前端
- **框架**：React 18
- **样式**：Tailwind CSS（Mobile First）
- **图表**：Recharts（轻量，React 生态）
- **HTTP 客户端**：Axios
- **部署**：Vercel（免费，自动部署）

## 后端
- **框架**：Java Spring Boot 3
- **API 风格**：REST
- **CSV 解析**：Apache Commons CSV
- **认证**：Spring Security + Session（HttpOnly Cookie）
- **部署**：Railway（免费额度）

## 数据库
- **数据库**：PostgreSQL（Railway 自带）
- **ORM**：Spring Data JPA + Hibernate

## 测试
- **后端**：JUnit 5 + Mockito
- **API 测试**：Postman（手动验证）

## 开发工具
- **版本控制**：Git + GitHub
- **本地开发**：Docker Compose（本地跑 PostgreSQL）

## 技术选择理由
- Java Spring Boot：贴近目标团队技术栈，个人项目也完全适用
- PostgreSQL：结构化记账数据，关系型数据库比 NoSQL 更合适
- React + Tailwind：现代响应式前端，Mobile First 体验好
- Railway + Vercel：免费、无需配置服务器、支持 cron job（未来 Plaid 阶段需要）