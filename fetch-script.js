import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import chardet from "chardet";
import iconv from "iconv-lite";
import { XMLParser } from "fast-xml-parser";

// =====================
// 인덱스 빌더
// =====================
function buildIndexes(dataTree, root = ".") {
  const textByKey = new Map();
  const keyByText = new Map();

  for (const dir of dataTree.children) {
    if (dir.type === "directory") {
      for (const child of dir.children) {
        if (child.key && child.text) {
          const dirKey = normalizeDirKey(path.relative(root, dir.path));
          textByKey.set(`${dirKey}:${child.key}`, child.text);
          keyByText.set(`${dirKey}:${child.text}`, child.key);
        } else if (child.type === "directory") {
          for (const item of child.children) {
            if (item.key && item.text) {
              const dirKey = normalizeDirKey(path.relative(root, child.path));
              textByKey.set(`${dirKey}:${item.key}`, item.text);
              keyByText.set(`${dirKey}:${item.text}`, item.key);
            }
          }
        }
      }
    }
  }
  return { textByKey, keyByText };
}

// =====================
// 디렉토리 키 정규화
// =====================
function normalizeDirKey(dirPath) {
  // 상대경로에서 최상위 폴더만 뽑아내고,
  // 그 이름을 최대한 뭉개서(두 번째 글자만) 사용
  const parts = dirPath.split(path.sep);
  const base = parts[0] || ".";
  return base.length >= 2 ? base[1] : base;
}

function findTextByKey(indexes, dirPath, key) {
  const dirKey = normalizeDirKey(dirPath);
  return indexes.textByKey.get(`${dirKey}:${key}`) || null;
}

function findKeyByText(indexes, dirPath, text) {
  const dirKey = normalizeDirKey(dirPath);
  return indexes.keyByText.get(`${dirKey}:${text}`) || null;
}

// =====================
// 디렉토리 탐색
// =====================
async function walkDirFlat(dir, handlers, root) {
  const entries = await readdir(dir, { withFileTypes: true });

  const tasks = entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return await walkDirFlat(fullPath, handlers, root);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (handlers[ext]) {
        const text = await readFileWithEncoding(fullPath);
        return await handlers[ext](fullPath, text);
      }
    }
    return [];
  });

  const results = await Promise.all(tasks);
  return results.flat().filter(Boolean);
}

async function readFileWithEncoding(fullPath) {
  const buffer = await readFile(fullPath);
  let encoding = chardet.detect(buffer);
  if (Array.isArray(encoding)) encoding = encoding[0];
  if (encoding) encoding = String(encoding).toLowerCase();
  if (!encoding || !iconv.encodingExists(encoding)) encoding = "utf-8";
  return iconv.decode(buffer, encoding);
}

export async function walkDirOneLevelFlat(dir, handlers = {}, root = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = { type: "directory", path: path.relative(root, dir) || ".", children: [] };

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const files = await walkDirFlat(fullPath, handlers, root);
      result.children.push({ type: "directory", path: path.relative(root, fullPath), children: files });
    }
  }
  return result;
}

async function walkDirMain(dir, handlers, indexesBundle, root = dir) {
  console.log("[DIR] Enter:", path.relative(root, dir) || ".");

  const entries = await readdir(dir, { withFileTypes: true });

  const tasks = entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const subTree = await walkDirMain(fullPath, handlers, indexesBundle, root);
      return subTree.children.length > 0 ? subTree : null;
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!handlers[ext]) {
        console.log("  [SKIP] unsupported ext:", fullPath);
        return null;
      }
      return await processFile(fullPath, ext, handlers, indexesBundle, root, path.relative(root, dir) || ".");
    }
    return null;
  });

  const children = (await Promise.all(tasks)).filter(Boolean);
  console.log("[DIR] Leave:", path.relative(root, dir) || ".", "children:", children.length);
  return { type: "directory", path: path.relative(root, dir) || ".", children };
}


async function processFile(fullPath, ext, handlers, indexesBundle, root, dirPath) {
  console.log("  [FILE] Start:", fullPath);
  if (!handlers[ext]) return null;

  const text = await readFileWithEncoding(fullPath);
  let content = await handlers[ext](fullPath, text);

  if (content) {
    content = annotateItems(content, dirPath, indexesBundle);
    console.log("  [FILE] Parsed:", fullPath, "items:", content.length);
    if (content.length > 0) {
      return { type: "file", path: path.relative(root, fullPath), content };
    }
  } else {
    console.log("  [FILE] Empty:", fullPath);
  }
  return null;
}

function annotateItems(items, dirPath, { oldIndexes, krIndexes, oldKrIndexes }) {
  return items
    .map(item => {
      const oldText = findTextByKey(oldIndexes, dirPath, item.key);
      const oldKey = findKeyByText(oldIndexes, dirPath, item.text);

      const base = { ...item };

      // 1. 텍스트가 달라진 경우
      if (oldText !== null && oldText !== item.text) {
        base.oldText = oldText;
      }

      // 2. 텍스트는 같지만 키가 달라진 경우 → movedFrom
      if (oldText === null && oldKey && oldKey !== item.key) {
        base.movedFrom = oldKey;
      }

      // 3. 완전히 새로 생긴 경우
      if (oldText === null && !oldKey) {
        base.newlyAdded = true;
      }

      return base;
    })
    // oldText, movedFrom, newlyAdded 중 하나라도 있는 항목만 남김
    .filter(item => item.oldText !== undefined || item.movedFrom !== undefined || item.newlyAdded)
    // 4. 번역 상태 추가
    .map(item => {
      const krText = findTextByKey(krIndexes, dirPath, item.key);
      const oldKrText =
        findTextByKey(oldKrIndexes, dirPath, item.key) ||
        (findKeyByText(oldIndexes, dirPath, item.text)
          ? findTextByKey(oldKrIndexes, dirPath, findKeyByText(oldIndexes, dirPath, item.text))
          : null);
      // 모든 텍스트 비교에 trim 적용
      const itemTextTrimmed = item.text?.trim();
      const krTextTrimmed = krText?.trim();
      const oldKrTextTrimmed = oldKrText?.trim();

      if (krTextTrimmed && krTextTrimmed === itemTextTrimmed) {
        return { ...item, copied: true };
      }
      if (item.movedFrom) {
        if (krTextTrimmed) {
          return { ...item, translated: krTextTrimmed ?? '' };
        }
        return { ...item, oldText_kr: oldKrTextTrimmed ?? '' };
      }
      if (item.newlyAdded) {
        return { ...item, translated: krTextTrimmed ?? '' };
      }
      if (oldKrTextTrimmed !== krTextTrimmed) {
        return { ...item, translated: krTextTrimmed ?? '' };
      }
      return { ...item, oldText_kr: oldKrTextTrimmed ?? '' };
    });
}

// =====================
// 파서
// =====================
export function parseUpdateSQLs(sql) {
  const regex = /SET\s+Text\s*=\s*'((?:''|[^'])*)'[\s\S]*?WHERE\s+Tag\s*=\s*'([^']+)'/gi;
  const results = [];
  let match;
  while ((match = regex.exec(sql)) !== null) {
    results.push({ text: match[1].replace(/''/g, "'"), key: match[2] });
  }
  return results;
}

export function parseRowsXML(xml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: true,
  });
  const parsed = parser.parse(xml);

  const results = [];

  // GameData 안의 모든 Language_* 노드를 순회
  if (parsed.GameData) {
    for (const [langName, langNode] of Object.entries(parsed.GameData)) {
      if (langName.startsWith("Language_")) {
        const rows = Array.isArray((langNode).Row)
          ? (langNode).Row
          : [(langNode).Row].filter(Boolean);

        for (const row of rows) {
          results.push({
            key: row["@_Tag"],
            text: row.Text,
          });
        }
      }
    }
  }

  return results;
}


// =====================
// 실행
// =====================
(async () => {
  const extensions = {
    ".sql": async (_, text) => parseUpdateSQLs(text),
    ".xml": async (_, text) => parseRowsXML(text),
  };

  console.log("parsing start");

  const olddata = await walkDirOneLevelFlat("./repos/old", extensions);
  const data_kr = await walkDirOneLevelFlat("./repos/current_kr", extensions);
  const olddata_kr = await walkDirOneLevelFlat("./repos/old_kr", extensions);

  console.log("indexes building...");
  const oldIndexes = buildIndexes(olddata);
  const krIndexes = buildIndexes(data_kr);
  const oldKrIndexes = buildIndexes(olddata_kr);

  console.log("parsing current...");
  const data = await walkDirMain("./repos/current", extensions, { oldIndexes, krIndexes, oldKrIndexes });
function calcTranslationCount(node) {
  if (node.type === "file" && Array.isArray(node.content)) {
    const total = node.content.length;
    const translated = node.content.filter(
      item => item.translated !== undefined // 빈 문자열도 포함
    ).length;
    node.translationTotal = total;
    node.translationDone = translated;
    return { total, translated };
  }

  if (node.type === "directory" && Array.isArray(node.children)) {
    let total = 0;
    let translated = 0;
    for (const child of node.children) {
      const result = calcTranslationCount(child);
      total += result.total;
      translated += result.translated;
    }
    node.translationTotal = total;
    node.translationDone = translated;
    return { total, translated };
  }

  return { total: 0, translated: 0 };
}


  calcTranslationCount(data);

  await writeFile("src/lib/data.json", JSON.stringify(data, null, 2), "utf-8");
  console.log("done!");
})();
