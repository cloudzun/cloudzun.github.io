---
title: '从原型到产品：vibe-Ecommerce 迭代系列（三）— 用户认证、流程失控与架构师的边界'
description: '从原型到产品：vibe-ecommerce 迭代系列（三） 用户认证、流程失控与架构师的边界 这是 vibe-ecommerce 迭代系列的第三篇。
'
pubDatetime: 2026-03-05T00:00:00Z
tags: ['opencode', 'vibe-coding', 'jwt', '认证', '架构设计']
---

从原型到产品：vibe-ecommerce 迭代系列（三）
用户认证、流程失控与架构师的边界
这是 vibe-ecommerce 迭代系列的第三篇。
上一篇
记录了 Phase 3 的后端引入——Express + SQLite + Nginx，前后端打通，订单数据第一次真正落库。
Phase 4 的目标看起来更简单：加用户认证。注册、登录、登出、历史订单。
但这一阶段发生了一件有意思的事：
OpenCode 跑偏了
。不是小偏，是完全跑到另一个方向上去了。
这篇文章想记录两件事：Phase 4 的技术实现，以及这次失控事件带来的流程反思。
一、Phase 4 的架构设计
认证方案选型
用户认证有很多做法。Phase 4 的约束是：
不引入 OAuth（第三方登录留到后面）
不依赖外部服务（Redis、Session DB）
前端是 SPA，部署在 Vercel，后端在独立服务器
这三个约束基本上把选项收窄到
JWT（JSON Web Token）
。
但 JWT 的实现方式也有讲究。最常见的错误是把 token 全部存在 localStorage，然后用 JavaScript 读取发请求。这样做简单，但有 XSS 风险——只要页面上有一段恶意脚本，就能偷走 token。
我们的做法是
双 token 架构
：
Access Token（短命）          Refresh Token（长命）
─────────────────────         ────────────────────────
有效期：15 分钟               有效期：7 天
存储：localStorage            存储：httpOnly cookie（服务端设置）
用途：每次 API 请求携带       用途：换新 access token
风险：XSS 可读                风险：CSRF（但我们没有表单提交，风险低）
Access token 短命，即使被偷，15 分钟后自动失效。Refresh token 存在 httpOnly cookie，JavaScript 完全读不到，XSS 无法直接窃取。
这不是完美方案（完美方案需要 Redis 做 token 黑名单），但对 Phase 4 的规模来说，这个权衡是合理的。
数据库变更
Phase 4 新增一张
users
表，并在
orders
表加一个可空的外键：
1
2
3
4
5
6
7
8
9
CREATE
TABLE
users
(
id
INTEGER
PRIMARY
KEY
AUTOINCREMENT
,
email
TEXT
UNIQUE
NOT
NULL
,
password_hash
TEXT
NOT
NULL
,
created_at
TEXT
DEFAULT
(
datetime
(
'now'
))
);
ALTER
TABLE
orders
ADD
COLUMN
user_id
INTEGER
REFERENCES
users
(
id
);
-- NULL = 游客订单，向后兼容
user_id
可空是一个关键设计决策：
游客下单不需要注册
。这保证了 Phase 3 的所有历史订单不受影响，也保证了 Phase 4 上线后游客仍然可以正常购物。
后端模块结构
server/
├── middleware/
│   └── auth.js          ← JWT 验证中间件（verifyToken）
├── routes/
│   ├── auth.js          ← 注册 / 登录 / 刷新 / 登出
│   ├── users.js         ← GET /me/orders（需认证）
│   ├── products.js      ← 不变（Phase 3）
│   └── orders.js        ← 更新：可选 token，关联 user_id
└── ecosystem.config.js  ← pm2 配置，注入 JWT_SECRET 环境变量
auth.js
中间件只做一件事：从
Authorization: Bearer <token>
头里取出 token，验证签名，把
{ id, email }
挂到
req.user
。
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
// server/middleware/auth.js
const
jwt
=
require
(
'jsonwebtoken'
);
function
verifyToken
(
req
,
res
,
next
)
{
const
header
=
req
.
headers
[
'authorization'
];
if
(
!
header
||
!
header
.
startsWith
(
'Bearer '
))
{
return
res
.
status
(
401
).
json
({
success
:
false
,
error
:
'No token provided'
});
}
try
{
req
.
user
=
jwt
.
verify
(
header
.
slice
(
7
),
process
.
env
.
JWT_SECRET
);
next
();
}
catch
{
return
res
.
status
(
401
).
json
({
success
:
false
,
error
:
'Invalid token'
});
}
}
简洁，无副作用，可复用。
前端模块结构
js/
├── auth.js              ← AuthService（token 生命周期管理）
├── components/
│   ├── login.js         ← #login 页面
│   ├── register.js      ← #register 页面（注册后自动登录）
│   └── account.js       ← #account 页面（历史订单）
└── components/
    └── checkout.js      ← 更新：登录用户预填 email，传 token
AuthService
是前端唯一知道 token 存在哪里的模块。其他组件只调用
AuthService.getToken()
，不直接操作 localStorage。这是一个简单的封装，但它把"token 存哪里"这个决策集中在一个地方——未来如果要改存储方式，只改
auth.js
就够了。
认证数据流
注册：
  RegisterPage → AuthService.register() → POST /api/auth/register
  → 自动调用 AuthService.login() → 存 token + user → 跳转 #account

登录：
  LoginPage → AuthService.login() → POST /api/auth/login
  → accessToken → localStorage
  → refreshToken → httpOnly cookie（服务端 Set-Cookie）
  → user { id, email } → localStorage → 导航栏显示用户名

登录用户下单：
  CheckoutPage → OrderAPI.create(order, token)
  → POST /api/orders（带 Authorization header）
  → 服务端解析 token → order.user_id = req.user.id

查看历史订单：
  AccountPage → AuthService.getOrders()
  → GET /api/users/me/orders（带 Bearer token）
  → 返回该用户所有订单 + 商品明细
二、安全细节
密码存储
密码用 bcryptjs 哈希，cost factor 12。这意味着每次哈希大约需要 100ms——对用户无感，但对暴力破解来说，每秒最多尝试 10 次。
1
2
3
4
const
hash
=
await
bcrypt
.
hash
(
password
,
12
);
// 验证时：
const
match
=
await
bcrypt
.
compare
(
password
,
stored_hash
);
// timing-safe，不会因为字符串比较时序泄露信息
明文密码永远不落库，不打日志，不出现在 API 响应里。
限流策略
限流只加在
/api/auth/login
和
/api/auth/register
，不加在
/refresh
和
/logout
。
这个区分很重要：
端点
限流？
原因
/login
✅ 10次/15分钟
防暴力破解
/register
✅ 10次/15分钟
防批量注册
/refresh
❌
正常用户频繁刷新是合理的
/logout
❌
限制登出没有任何安全收益
Phase 4 测试时就踩了这个坑——测试脚本连续调用
/refresh
和
/logout
，触发了限流，返回 429。发现后立即修复，把限流范围收窄。
三、OpenCode 跑偏事件
这才是这篇文章最值得记录的部分。
发生了什么
Phase 4 的实现计划分 10 个子任务，我把任务交给 OpenCode 执行。几分钟后检查输出，发现 OpenCode 正在创建
index.html
、
data.js
、
store.js
、
router.js
……
这些都是 Phase 1 的文件。
OpenCode 在重建整个原型
，完全忽略了 Phase 4 的认证任务。
根本原因
OpenCode 安装了 Superpowers，其中有一个
using-superpowers
skill，规则是：
“If you think there is even a 1% chance a skill might apply, you ABSOLUTELY MUST invoke the skill.”
OpenCode 收到任务后，自动触发了
writing-plans
skill。
writing-plans
扫描项目目录，发现了早期的 Phase 1 plan 文件（
docs/plans/2026-03-04-ecommerce-prototype.md
）。然后触发了
subagent-driven-development
skill，它把那个旧 plan 当成当前任务——完全覆盖了我给的指令。
Skill 链式触发 + 旧文档干扰 = 任务替换。
这不是 OpenCode 的 bug，也不是 Superpowers 的 bug。是我们对角色边界理解有误。
真正的问题：谁应该用 Skill？
Superpowers 的 skill 是工程智慧的结晶——
writing-plans
告诉你先规划再动手，
subagent-driven-development
告诉你如何并行拆任务。这些模式本身很有价值。
但问题是：
这些 skill 是给架构师用的，不是给执行者用的。
错误的用法：
我（架构师）→ 给 OpenCode 任务 → OpenCode 自主触发 skill → Skill 接管执行方向
正确的用法：
我（架构师）读 skill → 把 skill 精华融入任务设计 → 给 OpenCode 精准 prompt → OpenCode 只管执行
writing-plans
的价值，是提醒架构师在动手前先写计划——这正是我们 7-Gate 流程里的 GATE 1。
subagent-driven-development
的价值，是并行任务分解的思路——这正是我在设计实现计划时应该参考的。
Skill 是架构师的参考手册，不是 AI 的自动驾驶程序。
流程修复
事件发生后，我们做了三件事：
1. 立即处置
：kill OpenCode session，手动完成 Phase 4 所有代码
2. Prompt 约束
：所有 OpenCode 任务 prompt 加入约束头部：
【执行约束】
- 不要触发任何 skill
- 不要重新规划，直接执行以下任务
- 只创建/修改以下指定文件：[列表]
- 完成后汇报：做了什么、改了哪些文件
3. 角色边界文档化
：新建
PROCESS.md
，明确定义：
架构师
：读 skill、写 BRIEF、写计划、监控执行、验收质量
OpenCode
：收 prompt、执行、汇报，不规划不决策不触发 skill
四、关于"架构师不动手"的原则
这次事件还带出了另一个讨论：OpenCode 跑偏后，我直接接手写了所有 Phase 4 代码。
这是对的吗？
从结果看，代码质量没问题，Phase 4 按时交付。但从流程看，这是越权——架构师的职责是设计和监督，不是编码。
正确的处置应该是：
Kill OpenCode
重写更精准的 prompt
重新交给 OpenCode 执行
如果第二次还跑偏，再考虑架构师接手
这个原则的价值不在于"谁写代码"，而在于
保持职责清晰
。架构师一旦习惯了"跑偏就自己上"，就会逐渐失去对 OpenCode 能力边界的准确判断，也会让 OpenCode 永远停留在"需要人兜底"的状态。
这是我们在 Phase 4 复盘中写下的教训，也是 Phase 5 开始前要改变的习惯。
五、验收结果
Phase 4 完成后，跑了 15 项验收测试：
测试项
预期
结果
注册新用户
201 Created
✅
重复邮箱注册
409 Conflict
✅
密码不足 6 位
400 + 错误提示
✅
邮箱格式错误
400 + 错误提示
✅
正常登录返回 token
200 + accessToken
✅
密码错误
401
✅
无 token 访问受保护接口
401
✅
有 token 访问受保护接口
200
✅
登录用户下单关联 user_id
user_id = 正确 ID
✅
订单历史包含刚下的单
订单 + 商品明细
✅
游客下单向后兼容
200，user_id = NULL
✅
Refresh token 换新 access token
200 + 新 token
✅
Logout 清除 cookie
200
✅
Logout 后 refresh 失败
401
✅
Phase 3 /api/products 不受影响
200 + 商品列表
✅
15/15 全部通过
。
六、技术债与下一步
Phase 4 留下了一些已知债务，不是问题，是有意识的权衡：
债务
当前状态
计划
Token 存 localStorage
可接受（无敏感操作）
Phase 5 评估 httpOnly-only 方案
无邮箱验证
简单 regex
Phase 5 加 OTP 验证流
无密码重置
未实现
Phase 5
Rate limit 仅内存存储
单进程够用
Phase 6 迁移 Redis
无 JWT 黑名单
登出后 token 仍有效 15 分钟
Phase 5 评估
Phase 5 的重点是
安全与性能硬化
：express-validator 输入校验、ufw 替代 iptables、HTTP 安全头（helmet）、图片懒加载。
七、回顾这个系列
从 Phase 1 到 Phase 4，这个项目走过了一条完整的路：
Phase 1: 40 分钟 Vibe Coding → 927 行，能跑的原型
Phase 2: 前端打磨 → 搜索、排序、商品详情、订单确认
Phase 3: 引入后端 → Express + SQLite + Nginx，数据真正落库
Phase 4: 用户认证 → JWT + bcrypt，注册登录，历史订单
每一步都有一个核心问题要回答：
Phase 1：
AI 能多快生成一个可用原型？
（答案：很快，但质量需要把关）
Phase 2：
如何在 AI 生成的代码上做有质量的迭代？
（答案：7-Gate 流程）
Phase 3：
如何引入后端而不破坏前端？
（答案：向后兼容设计 + 接口契约）
Phase 4：
如何在 AI 协作中保持架构师的控制权？
（答案：清晰的角色边界）
最后这个问题，是这个系列到目前为止最重要的收获。
AI 工具越来越强，越来越自主。但"自主"不等于"正确"。架构师的价值，不在于能写多少代码，而在于能做多少正确的决策，以及能把错误的执行拉回正轨的速度。
Phase 4 的跑偏事件，是一次小规模的失控演练。它提醒我们：
工具越强大，边界越需要清晰。
项目地址
：
github.com/cloudzun/vibe-ecommerce
Live Demo
：
vibe-ecommerce-seven.vercel.app
API
：
shop-api.huaqloud.com