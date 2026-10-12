---
title: SQLの超超基礎（手で書く）
date: 2026-10-12
tags: [sql, database]
---

# SQLの超超基礎（手で書く）

## 導入

`SELECT` / `FROM` / `WHERE` / `ORDER BY` の4つだけを整理する。特定のDBには依存しない範囲で書く。

## サンプルテーブル

`users` テーブル:

| id | name | age | city |
|---|---|---|---|
| 1 | Alice | 30 | Tokyo |
| 2 | Bob | 25 | Osaka |
| 3 | Carol | 35 | Tokyo |
| 4 | Dave | 25 | Nagoya |

## SELECT / FROM

`FROM` で取り出すテーブルを、`SELECT` で取り出す列を指定する。

```sql
SELECT name, age FROM users;
```

| name | age |
|---|---|
| Alice | 30 |
| Bob | 25 |
| Carol | 35 |
| Dave | 25 |

すべての列を取り出すには `*` を使う。

```sql
SELECT * FROM users;
```

## WHERE

`WHERE` で条件に合う行だけに絞り込む。文字列はシングルクォートで囲む。

```sql
SELECT name, age FROM users WHERE city = 'Tokyo';
```

| name | age |
|---|---|
| Alice | 30 |
| Carol | 35 |

比較演算子は `=` / `<>` / `<` / `>` / `<=` / `>=`。条件は `AND` / `OR` / `NOT` で組み合わせる。

```sql
SELECT name, age FROM users WHERE city = 'Tokyo' AND age < 35;
```

| name | age |
|---|---|
| Alice | 30 |

## ORDER BY ASC / DESC

`ORDER BY` で並べ替える。`ASC` が昇順、`DESC` が降順で、省略すると `ASC` になる。

```sql
SELECT name, age FROM users ORDER BY age DESC;
```

| name | age |
|---|---|
| Carol | 35 |
| Alice | 30 |
| Bob | 25 |
| Dave | 25 |

Bob と Dave のように値が同じ行の順序は、DB の実装次第になる。順序を確定させたいときは、カンマ区切りで2つ目以降のキーを指定する。左のキーで同じだった行が、次のキーで比較される。

```sql
SELECT name, age FROM users ORDER BY age DESC, name ASC;
```

`ASC` / `DESC` は直前の式にだけかかる。`ORDER BY x, y DESC` と `ORDER BY x DESC, y DESC` は別物。

`ORDER BY` を書かなければ、行の順序は保証されない。

## 書く順と処理される順

書く順は `SELECT` → `FROM` → `WHERE` → `ORDER BY` だが、処理は次の順に進む。

1. `FROM`: テーブルを決める
2. `WHERE`: 行を絞り込む
3. `SELECT`: 出力する列を計算する
4. `ORDER BY`: 並べ替える

## まとめ

- `SELECT 列 FROM テーブル` が基本形
- `WHERE` で行を絞り込む
- `ORDER BY` で並べ替える。既定は `ASC`、降順は `DESC`
- 順序が必要なら `ORDER BY` を必ず書く

## Sources

- [PostgreSQL: SELECT](https://www.postgresql.org/docs/current/sql-select.html)
- [PostgreSQL: Querying a Table](https://www.postgresql.org/docs/current/tutorial-select.html)
