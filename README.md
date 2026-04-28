# 胜泰生科销售训练器

这是一个本地离线训练网页，用来反复练习光激项目、指标信息、竞品应对、销售开场、合同边界和价格锚点。

## 直接使用

双击根目录的 `start_sales_trainer.bat`。

它会先重新生成最新题库，再打开 [trainer/index.html](/c:/Users/liboz/研究生学习/硕士毕业后的工作/胜泰生科/trainer/index.html)。

## 训练模式

- 自适应刷题：优先抽你没做过或掌握不稳的题
- 错题重练：只练历史答错题
- 模拟销售：集中练销售话术、追问、竞品应对
- 考试模式：随机出题，不优先拉错题

## 当前题库来源

- [tools/generate_sales_learning_handbook.py](/c:/Users/liboz/研究生学习/硕士毕业后的工作/胜泰生科/tools/generate_sales_learning_handbook.py)
- [tools/generate_lica_visual_handbook.py](/c:/Users/liboz/研究生学习/硕士毕业后的工作/胜泰生科/tools/generate_lica_visual_handbook.py)
- [公司产品彩印/光激化学发光仪器学习笔记.md](/c:/Users/liboz/研究生学习/硕士毕业后的工作/胜泰生科/公司产品彩印/光激化学发光仪器学习笔记.md)
- [tools/build_sales_trainer_data.py](/c:/Users/liboz/研究生学习/硕士毕业后的工作/胜泰生科/tools/build_sales_trainer_data.py)

## 文件说明

- [trainer/index.html](/c:/Users/liboz/研究生学习/硕士毕业后的工作/胜泰生科/trainer/index.html)：页面入口
- [trainer/styles.css](/c:/Users/liboz/研究生学习/硕士毕业后的工作/胜泰生科/trainer/styles.css)：界面样式
- [trainer/app.js](/c:/Users/liboz/研究生学习/硕士毕业后的工作/胜泰生科/trainer/app.js)：训练逻辑
- [trainer/data.js](/c:/Users/liboz/研究生学习/硕士毕业后的工作/胜泰生科/trainer/data.js)：自动生成的题库，不建议手改

## 后续加知识

如果你后面又补了新项目、新竞品、新价格或新笔记，重新运行：

```powershell
python tools\build_sales_trainer_data.py
```

然后再打开网页即可。
