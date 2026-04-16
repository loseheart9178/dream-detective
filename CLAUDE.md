# CLAUDE.md - 造梦侦探：逻辑重构 开发规范

## 项目概述

**项目名称**: 《造梦侦探：逻辑重构》- AI生成式谋杀解谜游戏
**比赛**: 杭电AI产品设计大赛
**定位**: AI驱动的个性化剧本杀游戏，玩家输入关键词，AI实时生成独一无二的谋杀案件

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **AI**: 通义千问 API (文本生成) / 通义万相 API (图像生成) 或 OpenAI GPT-4o + DALL-E 3
- **部署**: 前端 Vercel, 后端 Render, 数据库 Supabase

## 目录结构

```
dream-detective/
├── CLAUDE.md              # 此文件 - 开发规范
├── README.md              # 项目介绍
├── .gitignore
├── packages/
│   ├── frontend/          # 前端React应用
│   │   ├── src/
│   │   │   ├── components/  # 可复用组件
│   │   │   ├── pages/      # 页面组件
│   │   │   ├── hooks/      # 自定义hooks
│   │   │   ├── types/      # TypeScript类型定义
│   │   │   ├── utils/      # 工具函数
│   │   │   ├── context/    # React Context
│   │   │   └── assets/     # 静态资源
│   │   ├── index.html
│   │   └── vite.config.ts
│   └── backend/           # Node.js后端API
│       ├── src/
│       │   ├── routes/    # API路由
│       │   ├── services/  # 业务逻辑（AI服务等）
│       │   ├── models/    # 数据模型
│       │   ├── middleware/# Express中间件
│       │   ├── utils/     # 工具函数
│       │   └── types/     # TypeScript类型定义
│       └── app.ts
└── docs/                 # 文档
    ├──策划案.md          # 比赛提交策划案
    ├── api.md            # API文档
    └── images/           # 文档配图
```

## 编码规范

### TypeScript / JavaScript

- 使用 **2空格** 缩进
- 使用 **单引号** 字符串
- 语句末尾 **不加分号**
- 必须使用 TypeScript 类型注解，禁止 `any` 除非必要
- 组件使用函数组件 + hooks，不使用class组件
- 文件名使用 `kebab-case`，类型定义使用 `PascalCase`

### React

- 组件导出使用命名导出
- 每个文件只放一个主组件
- Props 需要定义接口
- 状态逻辑尽量抽离到自定义hooks

### 后端

- 路由处理遵循RESTful规范
- 异步代码使用 async/await
- 错误统一处理，返回标准化JSON响应
- API响应格式：
  ```json
  {
    "success": true,
    "data": {...},
    "message": "error message if failed"
  }
  ```

### Git 提交规范

提交格式：
```
<type>: <description>

Types:
- feat: 新功能
- fix: 修复bug
- docs: 文档修改
- style: 格式修改，不影响代码
- refactor: 重构，不新增功能不修复bug
- perf: 性能优化
- test: 测试相关
- chore: 构建/工具相关
```

示例:
- `feat: 添加案件生成API`
- `fix: 修复JSON解析错误`
- `docs: 更新策划案`

## 开发流程

### 环境变量

必须配置以下环境变量：

**后端**:
```
OPENAI_API_KEY=xxx          # OpenAI API密钥（可选）
DASHSCOPE_API_KEY=xxx        # 阿里通义API密钥（推荐）
DATABASE_URL=xxx             # 数据库连接URL
PORT=3001
NODE_ENV=development
```

**前端**:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

### 本地开发命令

```bash
# 安装依赖
cd packages/frontend && npm install
cd ../backend && npm install

# 启动前端开发服务（端口 5173）
cd packages/frontend && npm run dev

# 启动后端开发服务（端口 3001）
cd packages/backend && npm run dev

# 构建生产版本
cd packages/frontend && npm run build
cd packages/backend && npm run build
```

### AI开发规则

1. **API密钥安全**:
   - 密钥永远只存在环境变量中，不能硬编码到代码
   - 前端不能直接调用AI API，必须通过后端转发
   - .env 文件加入 .gitignore，绝不提交到Git

2. **Prompt工程**:
   - Prompt模板统一存放在 `backend/src/utils/prompts/` 目录
   - 每个Prompt模板一个文件，方便调试优化
   - Prompt必须要求AI输出合法JSON，必须做格式校验

3. **错误处理**:
   - AI API调用必须有超时处理（90秒）
   - JSON解析失败必须自动重试
   - 生成失败必须给用户友好提示，不能崩溃

4. **内容安全**:
   - Prompt必须包含内容安全限制（禁止血腥暴力色情）
   - 后端增加内容审核过滤敏感关键词

## Claude Code 工作规则

1. **分步开发**: 一次只做一个功能，完成后再进行下一个
2. **先理解再修改**: 修改现有代码前必须先读取文件理解上下文
3. **保持简洁**: 不要添加不必要的抽象，够用就好
4. **比赛优先**: 保证可演示性优先，代码优雅其次
5. **测试驱动**: 写完功能要测试是否能正常运行
6. **环境隔离**: 开发环境和生产环境配置分离

## 比赛提交要求

提交材料清单：

- [ ] 策划案文档 (docs/策划案.md)
- [ ] 完整可运行源码
- [ ] 在线演示地址
- [ ] 演示视频（备用）
- [ ] 项目README说明

## 评审验收标准

- ✅ 能从关键词输入到案件完整生成
- ✅ 能进行推理交互，收集线索，询问嫌疑人
- ✅ 能提交答案，AI验证正确性
- ✅ 能展示真相复盘
- ✅ 部署在线可访问
- ✅ 文档完整
