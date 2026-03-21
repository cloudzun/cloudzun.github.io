# OpenCode 博客文章迁移进度

## 任务状态
- **开始时间**: 2026-03-21 13:14 UTC
- **状态**: 🟡 进行中
- **会话 ID**: `agent:opencode:acp:5451f096`

## TODO 清单

### Phase 1: 分析问题
- [ ] 检查所有 115 篇文章的 frontmatter
- [ ] 识别常见问题类型
- [ ] 统计每种问题的文章数量

### Phase 2: 编写修复脚本
- [ ] 日期格式转换 (date → pubDatetime, UTC 转换)
- [ ] 删除不需要的字段 (draft, categories)
- [ ] 格式统一 (引号转换)
- [ ] 多行 tags 转单行
- [ ] 添加缺失的 description 字段
- [ ] 修复 YAML 语法错误

### Phase 3: 执行修复
- [ ] 批量修复所有文章
- [ ] 验证修复结果

### Phase 4: 构建验证
- [ ] 运行 `npm run build`
- [ ] 确保无错误
- [ ] 提交并推送

## 实时日志

```
[等待 OpenCode 开始工作...]
```

---
*最后更新：2026-03-21 13:15 UTC*
