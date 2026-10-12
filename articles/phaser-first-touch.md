---
title: "Phaser 4 入門: スキャフォルドからビルドまで"
date: 2026-10-12
tags: [phaser, pnpm, typescript]
---

# Phaser 4 入門: スキャフォルドからビルドまで

## 導入

ブラウザ向けの2DゲームフレームワークであるPhaserを、少し触ってみた。公式テンプレートを pnpm で動かし、ロゴをクリックで回転させ、本番ビルドするまでを書く。

## 環境

| 項目 | バージョン |
|---|---|
| Node | v24.16.0 |
| pnpm | 11.6.0 |
| @phaserjs/create-game | 1.3.2 |
| phaser | 4.0.0（テンプレートで固定。npm の latest は 4.2.1） |
| vite | 6.3.2（package.json の指定は `^6.3.1`） |
| typescript | 5.7.3（package.json の指定は `~5.7.2`） |

## Phaser の位置づけ

Phaser は、ゲームループ、描画、アセットの読み込み、入力、tween、物理演算、カメラ、サウンドを引き受けるnpmパッケージだ。ライセンスはMIT。

```
自分のコード
  ↓
Phaser（npm パッケージ。pnpm で入れる）
  ↓
WebGL / Canvas 2D（ブラウザ組み込みの Web API。インストール不要）
  ↓
GPU / CPU
```

GameConfig で `type: AUTO` を指定すると、WebGLが使える環境ではWebGLで、使えない環境ではCanvasで描画する。

アプリケーション内部の構成は次のとおり。

- `Phaser.Game`（1つだけ）→ SceneManager → 複数の Scene → Game Object
- Scene の `preload()` / `create()` / `update()` は、自分ではなくPhaserが呼び出す
- Scene の中では、`this.load` / `this.add` / `this.input` / `this.tweens` などを通してエンジンの機能を使う
- アセットは `'logo'` のようなキーで読み込み、同じキーを指定して配置する

## スキャフォルド

```sh
pnpm create @phaserjs/game@latest
```

`pnpm create` を実行すると、`@phaserjs/create-game` が起動する。質問は次の順序で表示された。

1. Project Name
2. Select Option（Demo Game / Middleware / Client Framework / Web Bundler）→ Web Bundler
3. Template: vite
4. Minimal
5. TypeScript
6. 利用記録の送信への同意

最後の質問で N を押すと、作成されずに終了する。

完了時に表示される Next steps は `npm install` / `npm run dev` で、`package-lock.json` も同梱されていた。テンプレートはnpmで使う前提になっている。

## pnpm へ移行する

```sh
pnpm import            # package-lock.json から pnpm-lock.yaml を生成
rm package-lock.json
pnpm install
```

package.json には、`^6.3.1` のようなバージョンの範囲しか書かれていない。pnpm は `package-lock.json` を読まないので、そのまま install すると、範囲内のバージョンが新たに選び直される。`pnpm import` を使えば、テンプレート作者が検証したバージョンをそのまま引き継げる。

### esbuild のビルドスクリプトを許可する

`pnpm install` を実行すると、次のメッセージが表示された。

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.25.2
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

パッケージのリンクは終わっていた。また、`pnpm-workspace.yaml` が自動で生成され、次のように判断待ちの欄が用意されていた。

```yaml
allowBuilds:
  esbuild: set this to true or false
```

`esbuild: true` に書き換えて、もう一度 `pnpm install` を実行すると解決した。`pnpm approve-builds` を使えば、対話形式で許可することもできる。

pnpm 11 では、依存パッケージのビルドスクリプトの可否を `allowBuilds` で設定するようになり、`onlyBuiltDependencies` などの旧設定は廃止された。また、pnpm 固有の設定は、モノレポでなくても `pnpm-workspace.yaml` に書く。`.npmrc` はレジストリと認証の設定専用になった。

## 開発サーバー

```sh
pnpm dev-nolog   # http://localhost:8080
```

`dev` スクリプトは `node log.js dev & vite ...` になっていて、利用状況を送信する。送信したくなければ、`-nolog` の付いたほうを使う。

## テンプレートを読む

- `src/main.ts`: `DOMContentLoaded` のタイミングで `StartGame('game-container')` を呼ぶ
- `src/game/main.ts`: GameConfig（`type: AUTO`、1024×768、`Scale.FIT`、`scene: [MainGame]`）を渡して `new Game(...)` する
- `src/game/scenes/Game.ts`: `preload` で `bg` / `logo` を読み込み、`create` で配置する

## ロゴをクリックで回す

公式テンプレートの `Game.ts` をベースに、ロゴをクリックで回転させる処理を `create` に追加した。

```ts
const logo = this.add.image(512, 350, 'logo').setDepth(100);

logo.setInteractive({ useHandCursor: true });

logo.on('pointerdown', () => {
    if (this.tweens.isTweening(logo)) return;  // 回転中のクリックは無視する

    this.tweens.add({
        targets: logo,
        angle: '+=360',
        duration: 600,
        ease: 'Back.easeOut'
    });
});
```

## ハマりどころ: 回らない

手で写経したところ、ロゴが回らなかった。原因はタイポで、4か所あった。

| 書いたもの | 正しいもの | 影響 |
|---|---|---|
| `useHanCursor` | `useHandCursor` | カーソルが手の形にならない（型エラーにもならなかった） |
| `isTweeming` | `isTweening` | クリック時に実行時エラーが起きる |
| `target` | `targets` | tween の対象がなくなる |
| `'Back.easeout'` | `'Back.easeOut'` | エラーにならず、線形（等速）で回る |

Vite の開発サーバーは型チェックをしないので、型エラーがあっても画面は表示される。`tsc` を直接実行すると、原因が分かった。

```sh
pnpm exec tsc --noEmit
```

```
error TS2551: Property 'isTweeming' does not exist on type 'TweenManager'. Did you mean 'isTweening'?
error TS2345: ... Property 'targets' is missing ...
```

実行時エラーを確認するには、DevTools の Console も見る。

## 本番ビルド

```sh
pnpm build-nolog
```

`dist/` に次のファイルが出力された。

```
assets/phaser-<hash>.js   1,352,426 B   ← Phaser 本体
assets/index-<hash>.js        1,646 B   ← 自分のコード
assets/bg.png               302,554 B
assets/logo.png              24,692 B
```

`vite/config.prod.mjs` で `manualChunks: { phaser: ['phaser'] }` を指定し、Phaser 本体を別のチャンクに分けている。こうすると、ゲームのコードだけを更新したときに、Phaser 本体はブラウザのキャッシュから再利用される。自分で書いたコードは1.6KBだけだった。

## まとめ

- Phaser は、WebGL / Canvas 2D の上でゲームループや描画を引き受けるnpmパッケージ
- 公式テンプレートはnpmが前提なので、pnpm で使うなら `pnpm import` で移行する
- pnpm 11 では、esbuild などのビルドスクリプトを `allowBuilds` で明示的に許可する必要がある
- Vite の開発サーバーは型チェックをしない。おかしいと思ったら `tsc --noEmit` と Console を確認する

## Sources

- [Phaser](https://phaser.io/)
- [Phaser GameConfig](https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig)
- [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts)
- [@phaserjs/create-game](https://www.npmjs.com/package/@phaserjs/create-game)
- [Phaser GetEaseFunction（v4.0.0）](https://github.com/phaserjs/phaser/blob/v4.0.0/src/tweens/builders/GetEaseFunction.js)
- [pnpm 11.0 リリースノート](https://pnpm.io/blog/releases/11.0)
- [pnpm import](https://pnpm.io/cli/import)
- [pnpm create](https://pnpm.io/cli/create)
