# 造梦侦探：逻辑重构

AI驱动的个性化谋杀解谜游戏平台

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量（可选）

如果要使用AI生成功能，需要配置API密钥：

```bash
# 复制环境变量模板
cp packages/backend/.env.example packages/backend/.env

# 编辑 packages/backend/.env，填入您的API密钥
# OPENAI_API_KEY=your_key_here
# 或
# DASHSCOPE_API_KEY=your_key_here
```

**注意**：不配置API密钥也可以运行，系统会使用内置示例案件。

### 3. 启动开发服务

```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run dev:frontend  # 前端 http://localhost:5173
npm run dev:backend   # 后端 http://localhost:3001
```

### 4. 访问应用

打开浏览器访问 http://localhost:5173

## 项目结构

```
packages/
├── frontend/          # React前端
│   └── src/
│       ├── components/  # 可复用组件
│       │   ├── QuestionInput.tsx   # 问题输入（带直白度）
│       │   └── WaitingPage.tsx     # 生成等待页
│       ├── hooks/        # 自定义Hooks
│       │   ├── useApiConfig.ts     # API配置
│       │   └── useImmersionConfig.ts # 沉浸配置
│       ├── pages/        # 页面组件
│       │   ├── HomePage.tsx        # 首页
│       │   ├── CreateCasePage.tsx  # 创建案件
│       │   ├── GamePage.tsx        # 游戏主界面
│       │   └── ResultPage.tsx      # 真相复盘
│       └── types/        # TypeScript类型
│
└── backend/             # Node.js后端
    └── src/
        ├── db/          # SQLite数据库
        ├── routes/      # API路由
        └── services/    # 业务逻辑
            ├── caseService.ts   # 案件生成AI服务
            ├── imageService.ts  # 图片生成服务
            └── ttsService.ts     # 语音合成服务
```

## 功能特点

### 智能嫌疑人问答
- 问题直白度分类（危险/可疑/中性/委婉）
- AI根据问题类型调整回答策略
- 凶手会撒谎掩盖真相，非凶手可能无意透露线索

### 沉浸式体验（可选）
| 等级 | 内容 | 成本 |
|------|------|------|
| 基础 | 纯文本案件 | 免费 |
| 标准 | 案发现场图 + 关键线索图 + 语音回答 | 低 |
| 沉浸 | 高清图片 + 情感语音 + 背景音乐 | 中 |

支持全模态模型（如MiniMax）一Key多用：文本+图片+语音

### 等待页优化
- 展示经典侦探名言（福尔摩斯、波洛等）
- 生成进度实时显示
- 根据案件主题匹配故事内容

## API接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/case/generate | POST | 生成新案件 |
| /api/case/:id | GET | 获取案件详情 |
| /api/case/:id/submit | POST | 提交答案 |
| /api/case/:id/solution | GET | 获取真相 |
| /api/case/:id/ask | POST | 询问嫌疑人 |

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS
- **后端**：Node.js + Express + TypeScript
- **数据库**：SQLite（开发）/ PostgreSQL（生产）
- **AI**：支持9种文本供应商，图片/语音服务可扩展

### AI供应商支持
- **文本**：OpenAI, 通义千问, DeepSeek, Claude, 智谱, Moonshot, MiniMax, 本地部署, 自定义
- **图片**：MiniMax image-01, 通义万相, DALL-E 3
- **语音**：MiniMax TTS, 阿里云TTS, OpenAI TTS

## 比赛演示

### 演示流程
1. 首页点击"开始新游戏"
2. 输入关键词（如"游轮 暴风雨"）
3. 选择难度和沉浸等级，点击"生成案件"
4. 在游戏界面收集线索、询问嫌疑人
5. 提交答案，查看验证结果
6. 查看真相复盘

### 无AI演示
如果未配置API密钥，系统会使用内置示例案件，仍可完整演示游戏流程。

### 沉浸模式演示
1. 在设置页面选择沉浸等级（基础/标准/沉浸）
2. 配置全模态模型API（如MiniMax）用于图片和语音
3. 生成案件时观看等待页的侦探名言
4. 游戏中的案发现场图、嫌疑人画像、语音回答