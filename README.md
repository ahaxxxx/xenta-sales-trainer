# 胜泰生科销售训练器

这是一个纯前端静态训练器，用来练习 Xenta 相关项目、指标、竞品、销售话术、合同边界和价格锚点。页面不依赖后端服务，直接用浏览器即可运行。

## 使用方式

### 线上访问

如果这个仓库已经部署到 GitHub Pages，直接打开对应网址即可。

### 本地访问

如果你在原始资料仓库中维护题库，推荐使用项目根目录的 `start_sales_trainer.bat`。它会先重新生成最新 `data.js`，再打开网页。

如果这里只是一个独立的静态站点仓库，也可以直接双击 `index.html` 用浏览器打开。

## 文件说明

- `index.html`：页面入口
- `styles.css`：界面样式
- `app.js`：训练逻辑、知识库检索、统计与本地存储
- `data.js`：自动生成的题库和知识库数据，不建议手改
- `README.md`：仓库说明

## 如何更新题库

这个仓库适合做发布和展示。如果你平时是在原始工作目录里维护内容，建议按下面流程更新：

1. 在原始项目中运行：

```powershell
python tools\build_sales_trainer_data.py
```

2. 把最新的 `trainer/data.js` 复制到这个仓库。
3. 如果页面结构或样式有改动，再同步 `index.html`、`app.js`、`styles.css`。
4. 提交并推送到 GitHub。

## GitHub Pages 部署

如果你要把这个仓库部署到 GitHub Pages：

1. 进入仓库 `Settings -> Pages`
2. `Source` 选择 `Deploy from a branch`
3. `Branch` 选择 `main`
4. 目录选择 `/(root)`
5. 保存后等待 GitHub 完成构建

如果要绑定自定义域名：

1. 在 `Settings -> Pages` 中填写自定义域名
2. 在域名 DNS 后台添加 `CNAME`
3. 将子域名指向 `<你的 GitHub 用户名>.github.io`
4. 等 DNS 生效后启用 `Enforce HTTPS`

## 数据与隐私提示

这是静态站点。提交到仓库里的内容，以及通过 GitHub Pages 发布出去的内容，默认都可能被公网访问。

如果题库中包含内部销售口径、竞品分析、价格信息或其他敏感资料，请先确认是否适合公开，或者改用带访问控制的部署方式。

## 训练记录保存方式

训练进度默认保存在浏览器本地的 `localStorage` 中：

- 不会自动同步到其他设备
- 清空浏览器站点数据后记录会丢失
- 可以在页面里导出训练记录做备份
