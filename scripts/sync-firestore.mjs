import { readdir, readFile } from "node:fs/promises";
import matter from "gray-matter";
import { Firestore } from "@google-cloud/firestore";

const PROJECT_ID = "b-website-prod";
const ARTICLES_DIR = new URL("../articles/", import.meta.url);

const firestore = new Firestore({ projectId: PROJECT_ID });
const collection = firestore.collection("articles");

const files = (await readdir(ARTICLES_DIR)).filter((name) => name.endsWith(".md"));
const slugs = new Set();

for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    slugs.add(slug);

    const raw = await readFile(new URL(file, ARTICLES_DIR), "utf-8");
    const { data, content } = matter(raw);

    // gray-matter(内部のYAMLパーサ)は "date: 2026-09-20" のような未クォートの日付を
    // 自動的にJSのDateオブジェクトへ変換するため、そのままFirestoreに書き込むと
    // stringValueではなくtimestampValueになってしまう。設計(date: string)通りに
    // 文字列として保存するため、Dateの場合はYYYY-MM-DD形式の文字列へ変換する。
    const date =
        data.date instanceof Date
            ? data.date.toISOString().slice(0, 10)
            : (data.date ?? "");

    await collection.doc(slug).set({
        title: data.title ?? slug,
        date,
        tags: data.tags ?? [],
        body: content.trim(),
    });
    console.log(`synced: ${slug}`);
}

// articles/ から削除された記事は、gitを正としてFirestore側も削除し整合性を保つ
const existingDocs = await collection.listDocuments();
for (const doc of existingDocs) {
    if (!slugs.has(doc.id)) {
        await doc.delete();
        console.log(`deleted: ${doc.id}`);
    }
}
