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

    await collection.doc(slug).set({
        title: data.title ?? slug,
        date: data.date ?? "",
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
