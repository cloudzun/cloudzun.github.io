---
title: '从原型到产品：vibe-Ecommerce 迭代系列（四）— 安全加固、性能优化与图片修复'
description: '这是 vibe-ecommerce 迭代系列的第四篇。
上一篇记录了 Phase 4 的用户认证——JWT 双 token 架构、bcrypt 密码存储，以及一次 OpenCode 跑偏事件和流程修复。
Phase 5 的目标是「硬化」。不是加新功能，而是把已有的东西做得更扎实：输入校验、安全头部、性能优化、图片修复。
这一阶段没有戏剧性事件，但有几个值得记录的技术决策。
一、Phase 5 的问'
pubDatetime: 2026-03-06T00:00:00Z
tags: ['vibe-coding', 'opencode', 'security', 'performance', 'express-validator']
---

这是 vibe-ecommerce 迭代系列的第四篇。
上一篇
记录了 Phase 4 的用户认证——JWT 双 token 架构、bcrypt 密码存储，以及一次 OpenCode 跑偏事件和流程修复。
Phase 5 的目标是「硬化」。不是加新功能，而是把已有的东西做得更扎实：输入校验、安全头部、性能优化、图片修复。
这一阶段没有戏剧性事件，但有几个值得记录的技术决策。
一、Phase 5 的问题清单
Phase 4 结束时，我们做了一次系统审计，列出了以下问题：
问题
严重程度
说明
无输入校验库
高
orders 和 auth 路由只有手动 if 检查
helmet CSP 阻断图片
中
默认 CSP 不允许外部图片域名，Unsplash 图片被拦截
请求体无大小限制
中
Express 默认 100kb，未显式配置
4 个商品图片错误
中
USB-C Hub、Webcam HD、Portable SSD、Monitor Stand 图文不符
无图片懒加载
低
10 张图片同时加载，首屏性能损耗
无 API 响应缓存
低
每次请求都查数据库，即使数据不变
这六个问题分成两个模块处理：Module A（后端安全）和 Module B（前端性能 + 图片修复）。
二、Module A：输入安全
为什么要用 express-validator
Phase 4 的 auth 路由里有这样的代码：
1
2
3
4
5
6
7
8
9
if
(
!
email
||
!
password
)
{
return
res
.
status
(
400
).
json
({
success
:
false
,
error
:
'Email and password are required'
});
}
if
(
!
EMAIL_RE
.
test
(
email
))
{
return
res
.
status
(
400
).
json
({
success
:
false
,
error
:
'Invalid email format'
});
}
if
(
password
.
length
<
6
)
{
return
res
.
status
(
400
).
json
({
success
:
false
,
error
:
'Password must be at least 6 characters'
});
}
这种手动校验有几个问题：
分散
：每个路由各写一套，逻辑重复
不一致
：orders 路由的校验比 auth 路由弱
错误格式不统一
：有时返回
error
字符串，有时没有字段信息
express-validator
解决了这三个问题。校验逻辑声明式，集中在中间件里，错误格式统一。
校验中间件设计
新建
server/middleware/validate.js
，定义两套校验链：
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
const
validateOrder
=
[
body
(
'name'
).
trim
().
isLength
({
min
:
1
,
max
:
100
}).
withMessage
(
'Name is required (max 100 chars)'
),
body
(
'email'
).
isEmail
().
normalizeEmail
().
withMessage
(
'Valid email required'
),
body
(
'address'
).
trim
().
isLength
({
min
:
1
,
max
:
200
}).
withMessage
(
'Address is required (max 200 chars)'
),
body
(
'items'
).
isArray
({
min
:
1
}).
withMessage
(
'At least one item required'
),
body
(
'total'
).
isFloat
({
gt
:
0
}).
withMessage
(
'Total must be a positive number'
),
];
const
validateRegister
=
[
body
(
'email'
).
isEmail
().
normalizeEmail
().
withMessage
(
'Invalid email format'
),
body
(
'password'
).
isLength
({
min
:
6
}).
withMessage
(
'Password must be at least 6 characters'
),
];
统一的错误处理中间件：
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
function
handleValidationErrors
(
req
,
res
,
next
)
{
const
errors
=
validationResult
(
req
);
if
(
!
errors
.
isEmpty
())
{
return
res
.
status
(
422
).
json
({
success
:
false
,
errors
:
errors
.
array
().
map
(
e
=>
({
field
:
e
.
path
,
message
:
e
.
msg
}))
});
}
next
();
}
注意返回 422（Unprocessable Entity）而不是 400（Bad Request）。422 语义更准确：请求格式正确，但内容无法处理。
使用时，中间件链式挂载：
1
2
router
.
post
(
'/'
,
validateOrder
,
handleValidationErrors
,
async
(
req
,
res
)
=>
{
...
})
router
.
post
(
'/register'
,
validateRegister
,
handleValidationErrors
,
async
(
req
,
res
)
=>
{
...
})
验证效果
空 body 提交订单，现在返回：
字段级错误，前端可以直接用来高亮对应输入框。
helmet CSP 定制
helmet()
默认开启 Content Security Policy，其中
img-src
只允许
'self'
和
data:
。Unsplash 图片域名不在白名单，会被浏览器拦截。
修复方式：
1
2
3
4
5
6
7
8
app
.
use
(
helmet
({
contentSecurityPolicy
:
{
directives
:
{
...
helmet
.
contentSecurityPolicy
.
getDefaultDirectives
(),
'img-src'
:
[
"'self'"
,
'data:'
,
'https://images.unsplash.com'
],
}
}
}));
...getDefaultDirectives()
保留所有默认规则，只覆盖
img-src
。这是最小变更原则——不要为了解决一个问题而放宽整个 CSP。
同时把 JSON 请求体限制改为显式配置：
1
app
.
use
(
express
.
json
({
limit
:
'10kb'
}));
Express 默认 100kb，对于这个项目的 API 来说太宽松。订单请求最多几个商品，10kb 绰绰有余。
三、图片修复：验证流程
4 个商品的图片错误是历史遗留问题——Phase 1 用 Unsplash 图片时，photo ID 和商品名称没有严格对应。
修复不复杂，但有一个容易忽略的步骤：
验证候选图片内容
。
流程：
找候选 Unsplash photo ID
验证 HTTP 可访问性（
curl -s -o /dev/null -w "%{http_code}"
）
用 AI 图片分析确认内容与商品名称匹配
写幂等迁移脚本更新数据库
第 3 步很重要。Monitor Stand 的原图
photo-1593640408182-31c228b29b5e
已经 404，直接换一个新 ID 不够——新 ID 的图片内容也要对。
最终选定：
商品
原图问题
新 photo ID
内容描述
USB-C Hub
图文不符
photo-1601524909162-ae8725290836
多设备桌面连接场景
Webcam HD
图文不符
photo-1535303311164-664fc9ec6532
摄像头特写
Portable SSD
图文不符
photo-1639322537228-f710d846310a
便携固态硬盘
Monitor Stand
404
photo-1616763355548-1b606f439f86
多显示器支架桌面
迁移脚本设计为幂等——多次运行结果相同，不会产生副作用：
1
2
3
4
5
6
7
8
const
fixes
=
[
{
id
:
3
,
image
:
'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=400&h=300&fit=crop'
},
{
id
:
4
,
image
:
'https://images.unsplash.com/photo-1535303311164-664fc9ec6532?w=400&h=300&fit=crop'
},
// ...
];
for
(
const
fix
of
fixes
)
{
await
knex
(
'products'
).
where
({
id
:
fix
.
id
}).
update
({
image
:
fix
.
image
});
}
四、Module B：前端性能
图片懒加载
两层实现：
第一层：HTML 原生懒加载
1
<
img
loading
=
"lazy"
src
=
"..."
alt
=
"..."
>
浏览器原生支持，零 JavaScript，覆盖所有现代浏览器。应用到三个组件：products.js、product-detail.js、cart.js。
第二层：IntersectionObserver 渐入动画
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
16
17
if
(
'IntersectionObserver'
in
window
)
{
const
observer
=
new
IntersectionObserver
((
entries
)
=>
{
entries
.
forEach
(
e
=>
{
if
(
e
.
isIntersecting
)
{
e
.
target
.
style
.
opacity
=
'1'
;
observer
.
unobserve
(
e
.
target
);
}
});
},
{
rootMargin
:
'50px'
});
document
.
querySelectorAll
(
'.product-card img'
).
forEach
(
img
=>
{
img
.
style
.
opacity
=
'0'
;
img
.
style
.
transition
=
'opacity 0.3s'
;
img
.
addEventListener
(
'load'
,
()
=>
{
img
.
style
.
opacity
=
'1'
;
});
observer
.
observe
(
img
);
});
}
rootMargin: '50px'
让图片在进入视口前 50px 就开始加载，避免用户看到空白闪烁。
'IntersectionObserver' in window
做特性检测，不支持的浏览器直接跳过，不影响功能。
这里选择了渐入动画而不是
data-src
替换方案。原因：
loading="lazy"
已经处理了延迟加载的核心逻辑，IntersectionObserver 只是增加视觉反馈。
data-src
方案需要修改所有图片渲染逻辑，风险更高，收益相同。
API 响应缓存
GET /api/products 是访问最频繁的接口，但数据几乎不变。加一个简单的内存缓存：
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
const
cache
=
{
data
:
null
,
ts
:
0
,
TTL
:
5
*
60
*
1000
};
router
.
get
(
'/'
,
async
(
req
,
res
)
=>
{
// 有过滤条件时绕过缓存
if
(
!
req
.
query
.
category
&&
cache
.
data
&&
(
Date
.
now
()
-
cache
.
ts
)
<
cache
.
TTL
)
{
return
res
.
json
({
success
:
true
,
data
:
cache
.
data
});
}
// ... 查数据库 ...
if
(
!
req
.
query
.
category
)
{
cache
.
data
=
products
;
cache
.
ts
=
Date
.
now
();
}
res
.
json
({
success
:
true
,
data
:
products
});
});
两个设计决策值得说明：
为什么带
?category=
时绕过缓存？
缓存多个过滤组合的复杂度不值得——只有 10 个商品，过滤查询本身已经很快（2ms）。全量缓存覆盖了最常见的首页加载场景，这就够了。
为什么用内存缓存而不是 Redis？
Phase 5 的目标是「够用」，不是「完美」。单进程 Node.js + 内存缓存，在这个规模下完全合理。Redis 是 Phase 6 的事，当需要多进程或分布式部署时再引入。
五、验收结果
Phase 5 全部 7 个任务，OpenCode 一次性完成，无需人工干预。
测试
预期
结果
空 body 下单
422 + 5 字段错误
✅
邮箱格式错误 + 密码过短
422
✅
合法订单
200 + orderId
✅
图片 3,4,5,9 URL 更新
新 Unsplash ID
✅
CSP header 允许 unsplash.com
img-src 包含域名
✅
API 缓存命中
第 2 次响应更快
✅
Phase 3/4 登录回归
success: true
✅
生产环境端到端（注册→登录→下单→历史订单）
全流程通过
✅
六、这次 OpenCode 执行为什么顺利
Phase 4 发生了跑偏事件，Phase 5 没有。原因是 Phase 4 之后我们做了三件事：
1. 约束头部
所有 prompt 开头加
【执行约束】
，明确禁止触发 skill、禁止重新规划、只操作指定文件。
2. 精确的任务规格
每个任务都有：输入文件、输出文件、具体代码片段、验证命令。OpenCode 不需要做任何判断，只需要执行。
3. PTY 模式启动
这次发现
sessions_spawn(runtime="acp")
无法启动（opencode 不在系统 PATH 中）。改用
exec(pty=true, background=true)
直接调用
~/.opencode/bin/opencode
，稳定可靠。
这三点加在一起，把 OpenCode 的执行空间压缩到最小——它只需要做一件事：按规格写代码。
七、技术债与 Phase 6
Phase 5 清理了 Phase 4 遗留的输入校验债务，没有引入新的技术债。
当前剩余的已知债务：
债务
当前状态
Phase 6 计划
Token 存 localStorage
可接受（无敏感操作）
评估 httpOnly-only 方案
无邮箱验证流程
未实现
OTP/链接验证
无密码重置
未实现
邮件重置流程
JWT 登出后仍有效
无黑名单
Redis token 黑名单
Rate limiting 仅内存
单进程够用
Redis 分布式限流
Phase 6 的候选方向：SDD 重构（代码库接近复杂度阈值）、容器化（Docker Compose 本地开发一致性）、Azure SQL DB 迁移（Knex 方言切换，零代码改动）。
项目地址：
github.com/cloudzun/vibe-ecommerce
Live Demo：
vibe-ecommerce-seven.vercel.app
API：
shop-api.huaqloud.com