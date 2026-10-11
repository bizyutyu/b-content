---
title: Elm 0.19.3 を30分触って押さえた基礎
date: 2026-10-11
tags: [elm, functional-programming, ソースコードを読む]
---

# Elm 0.19.3 を30分触って押さえた基礎

## 導入

Elmを約30分、自分で触ってみたので、学んだことを1枚にまとめた。範囲は環境構築、`elm repl` での型の確認、The Elm Architecture によるカウンターの実装と機能追加、詰まった点まで。

## 環境構築

グローバルインストールはせず、`npx` で都度実行する。npmの `elm` パッケージは `latest` タグが `0.19.3-0` を指している（`npm view elm dist-tags` で確認できる）。

```sh
npx elm@0.19.3-0 init
```

`elm init` を実行すると `elm.json` と `src/` が生成される。`elm.json` の `dependencies.direct` には、最初から `elm/browser`・`elm/core`・`elm/html` が入っている。ブラウザで動く最小のアプリなら、パッケージを追加しなくても書き始められる。

## elm repl と型

`npx elm@0.19.3-0 repl` で対話環境が起動する。式を評価すると、値と一緒に型が表示される。

```
> add a b = a + b
<function> : number -> number -> number
> add 3
<function> : number -> number
```

`add` に引数を1つだけ渡すと、残りの引数を待つ関数が返る。これが部分適用だ。`number` は `Int` と `Float` のどちらにもなれる型変数。

なお、REPLで定義したものはセッションを閉じると消える。残したいものは `.elm` ファイルに書く。

### `->` の2つの意味

`->` は文脈によって意味が違う。

| 場所 | 意味 | 例 |
|---|---|---|
| 型注釈 | 受け取る型 `->` 返す型 | `add : number -> number -> number` |
| `case` 式 | パターン `->` 結果 | `Increment -> model + 1` |

型注釈の `a -> b -> c` は「`a` を受け取り、`b -> c` という関数を返す」と読む。引数を1つ渡すたびに矢印が1本減る。上の `add 3` の型が `number -> number` になるのはこのためだ。

## カウンターを作る

まずは公式ガイドの [Buttons](https://guide.elm-lang.org/architecture/buttons.html) にある、`+` と `-` で増減するだけのカウンターを `src/Main.elm` に書いた。

動作確認には `npx elm@0.19.3-0 reactor` を使う。`http://localhost:8000` を開き、`src/Main.elm` を選ぶとコンパイルされて表示される。

## リセットボタンを追加する

次に、カウンターを0に戻すリセットボタン（ガイドの演習課題）を追加した。やってみて、The Elm Architecture では、機能追加はだいたい次の3か所を順に触れば完成することが分かった。

1. `Msg` に新しい出来事 `Reset` を足す
2. `update` に `Reset` が来たときの処理（0に戻す）を書く
3. `view` に `Reset` を送るボタンを置く

完成形は以下の通り。

```elm
module Main exposing (main)

import Browser
import Html exposing (Html, button, div, text)
import Html.Events exposing (onClick)

-- MAIN

main = Browser.sandbox { init = init, update = update, view = view }

-- MODEL

type alias Model = Int

init : Model
init = 0

-- UPDATE

type Msg = Increment | Decrement | Reset

update : Msg -> Model -> Model
update msg model =
    case msg of
        Increment -> model + 1
        Decrement -> model - 1
        Reset -> init

-- VIEW

view : Model -> Html Msg
view model =
    div []
        [ button [ onClick Decrement ] [ text "-" ]
        , div [] [ text (String.fromInt model) ]
        , button [ onClick Increment ] [ text "+" ]
        , button [ onClick Reset ] [ text "リセット" ]
        ]
```

### ソースコードを読む

**module / import**

`module Main exposing (main)` で、このファイルを `Main` モジュールとし、`main` だけを外部に公開する。`import Html exposing (Html, button, div, text)` は、`Html` モジュールのうち列挙した名前を修飾なしで使えるようにする。`exposing` しなかったもの（`String.fromInt` など）は `モジュール名.関数名` で呼ぶ。

**main**

`Browser.sandbox` に `init`・`update`・`view` の3つを渡すと、アプリが組み上がる。sandboxは外部との通信（HTTPや時刻など）を持たない最小構成だ。

**Model**

`type alias Model = Int` は `Int` に `Model` という別名を付けているだけで、状態はただの整数。`init` がその初期値 `0` になる。

**Msg**

`type Msg = Increment | Decrement | Reset` は、「起こりうる操作」を列挙したカスタム型。`Msg` の値はこの3つ以外に存在しない。

**update**

`update : Msg -> Model -> Model` は「メッセージと現在の状態を受け取り、新しい状態を返す」関数。`case msg of` でメッセージごとに分岐する。`Reset -> init` と書くと、リセット後の値が初期値と常に一致する（`0` を直書きすると、初期値を変えたときにずれる）。

**view**

`view : Model -> Html Msg` は状態からHTMLを組み立てる。`div [] [...]` のように、HTML要素の関数は「属性のリスト」と「子要素のリスト」の2つを受け取る。`onClick Increment` は「クリックされたら `Increment` を送る」という属性で、送られたメッセージはランタイムが `update` に渡す。`text` は文字列しか受け取らないので、`Int` は `String.fromInt` で変換する。

## 代入はなく束縛だけ

Elmに代入はない。`=` は名前と値の束縛で、一度束縛したら書き換えられない。関数内で局所的に名前を付けるときは `let ... in` を使う。

```elm
total : Int -> Int -> Int
total price count =
    let
        subtotal =
            price * count
    in
    subtotal + 100
```

状態が変わるのは、`update` が新しい `Model` を返し、それをランタイムが受け取ったときだけだ。カウンターも `model` を書き換えているのではなく、`model + 1` という新しい値を返している。

Haskellを触ったことがあったので、このあたりは理解しやすかった。

## ハマりどころ

コードを書いていて詰まった点。

- **タブ文字**: インデントにタブを使うとエラーになる。スペースでインデントする
- **型名は大文字始まり**: 型注釈で小文字の名前を書くと、具体的な型ではなく型変数として扱われる
- **`case` の小文字パターン**: `case` で `reset ->` のように小文字で書くと、`Reset` とのマッチではなく「何にでもマッチする変数」になる。後続の分岐には到達できなくなり、エラーになる

## まとめ

できるようになったこと。

- `npx` で Elm を呼び出し、`elm init` でプロジェクトを作る
- `elm repl` で式の型を確かめ、部分適用と矢印 `->` の読み方を理解する
- The Elm Architecture（Model / Update / View）でアプリを書き、`elm reactor` で動かす
- `Msg` → `update` → `view` の3か所を触って、自力で機能を追加する
- Elm に代入はなく、`=` は Haskell と同じ束縛であること、そして状態は「新しい値を返す」ことで変えること

## Sources

- [An Introduction to Elm - Buttons](https://guide.elm-lang.org/architecture/buttons.html)
- [An Introduction to Elm - The Elm Architecture](https://guide.elm-lang.org/architecture/)
- [elm - npm](https://www.npmjs.com/package/elm)
