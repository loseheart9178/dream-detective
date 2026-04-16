# 造梦侦探：逻辑重构

AI驱动的个性化谋杀解谜游戏平台

## 快速开始

### 1. 安装依赖

```bash
cd "C:\Users\loseheart\Desktop\DreamSleuth The Infinite Case"
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
│       ├── pages/     # 页面组件
│       │   ├── HomePage.tsx        # 首页
│       │   ├── CreateCasePage.tsx  # 创建案件
│       │   ├── GamePage.tsx        # 游戏主界面
│       │   └── ResultPage.tsx      # 真相复盘
│       └── types/     # TypeScript类型
│
└── backend/           # Node.js后端
    └── src/
        ├── routes/    # API路由
        └── services/  # 业务逻辑（AI服务）
```

## API接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/case/generate | POST | 生成新案件 |
| /api/case/:id | GET | 获取案件详情 |
| /api/case/:id/submit | POST | 提交答案 |
| /api/case/:id/solution | GET | 获取真相 |

## 技术栈

- 前端：React 18 + TypeScript + Vite + Tailwind CSS
- 后端：Node.js + Express + TypeScript
- AI：OpenAI GPT-4o / 通义千问

## 比赛演示

### 演示流程
1. 首页点击"开始新游戏"
2. 输入关键词（如"游轮 暴风雨"）
3. 选择难度，点击"生成案件"
4. 在游戏界面收集线索、询问嫌疑人
5. 提交答案，查看验证结果
6. 查看真相复盘

### 无AI演示
如果未配置API密钥，系统会使用内置示例案件，仍可完整演示游戏流程。