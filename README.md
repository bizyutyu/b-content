# b-content

個人サイト（[b-web](https://github.com/bizyutyu/b-web)）向けの記事コンテンツリポジトリ。

## 運用方針

- 記事は Markdown（frontmatter付き）として `articles/` に置く
- コミットは `main` へ直接push（feature branch・PRは介さない）
- 配信用データストア（Firestore）への同期は、`main` への push で自動実行せず、**手動トリガー（workflow_dispatch）限定**で行う（CI未実装、別Issueで対応予定）

## 記事のfrontmatter

```
---
title: 記事タイトル
date: YYYY-MM-DD
tags: [tag1, tag2]
---
```

## 関連リポジトリ

| リポジトリ | 用途 |
|---|---|
| [bizyutyu/b-web](https://github.com/bizyutyu/b-web) | フロントエンド |
| [bizyutyu/b-infra](https://github.com/bizyutyu/b-infra) | インフラ（IaC） |
