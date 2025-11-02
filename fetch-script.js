import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import chardet from "chardet";
import iconv from "iconv-lite";
import { XMLParser } from "fast-xml-parser";

// =====================
// 인덱스 빌더
// =====================
/**
 * @typedef {Object} Indexes
 * @property {Map<string, string>} textByKey - `${dirKey}:${key}` 형태로 원문 텍스트를 저장하는 맵
 * @property {Map<string, string>} keyByText - `${dirKey}:${text}` 형태로 key를 역으로 찾을 수 있는 맵
 */
/**
 * 주어진 데이터 트리에서 key-text 인덱스를 구축합니다.
 *
 * - 각 디렉토리 내의 항목(child)에서 `key`와 `text`를 추출하여
 *   `${dirKey}:${key}` → text, `${dirKey}:${text}` → key 형태로 저장합니다.
 * - 중첩된 디렉토리(child.type === "directory")도 재귀적으로 순회합니다.
 * - `dirKey`는 `normalizeDirKey(path.relative(root, dir.path))`로 계산됩니다.
 *
 * @param {{ type?: string; path?: string; children: any; }} dataTree - 루트 데이터 트리
 * @param {string} [root="."] - 기준이 되는 루트 경로
 * @returns {Indexes} key-text 매핑 인덱스 객체
 */
export function buildIndexes(dataTree, root = ".") {
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
/**
 * 주어진 상대 경로에서 최상위 디렉토리 이름을 추출한 뒤,
 * 그 이름을 단순화하여 반환합니다.
 *
 * 규칙:
 * - 경로를 `path.sep` 기준으로 분리한 후 첫 번째 요소를 사용합니다.
 * - 요소가 없으면 "."을 기본값으로 사용합니다.
 * - 이름 길이가 2 이상이면 두 번째 글자만 반환합니다.
 * - 그렇지 않으면 이름 전체를 반환합니다.
 *
 * 예:
 *  - "src/components" → "r"  (첫 요소 "src"의 두 번째 글자)
 *  - "a" → "a"
 *  - "" → "."
 *
 * @param {string} dirPath - 상대 경로 문자열
 * @returns {string} 단순화된 디렉토리 키
 */
function normalizeDirKey(dirPath) {
  const parts = dirPath.split(path.sep);
  const base = parts[0] || ".";
  return base.length >= 2 ? base[1] : base;
}
/**
 * 주어진 key에 해당하는 텍스트를 반환합니다.
 *
 * @param {Indexes} indexes - buildIndexes로 생성된 인덱스 객체
 * @param {string} dirPath - 기준 디렉토리 경로
 * @param {string} key - 조회할 key
 * @returns {string|null} 해당 key의 텍스트, 없으면 null
 */
function findTextByKey(indexes, dirPath, key) {
  const dirKey = normalizeDirKey(dirPath);
  return indexes.textByKey.get(`${dirKey}:${key}`) || null;
}

/**
 * 주어진 텍스트에 해당하는 key를 반환합니다.
 *
 * @param {Indexes} indexes - buildIndexes로 생성된 인덱스 객체
 * @param {string} dirPath - 기준 디렉토리 경로
 * @param {string} text - 조회할 텍스트
 * @returns {string|null} 해당 텍스트의 key, 없으면 null
 */
function findKeyByText(indexes, dirPath, text) {
  const dirKey = normalizeDirKey(dirPath);
  return indexes.keyByText.get(`${dirKey}:${text}`) || null;
}

// =====================
// 디렉토리 탐색
// =====================
// @ts-ignore
async function walkDirFlat(dir, handlers, root) {
  const entries = await readdir(dir, { withFileTypes: true });

  // @ts-ignore
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

  // @ts-ignore
  const results = await Promise.all(tasks);
  return results.flat().filter(Boolean);
}

// @ts-ignore
async function readFileWithEncoding(fullPath) {
  const buffer = await readFile(fullPath);
  let encoding = chardet.detect(buffer);
  if (Array.isArray(encoding)) encoding = encoding[0];
  if (encoding) encoding = String(encoding).toLowerCase();
  if (!encoding || !iconv.encodingExists(encoding)) encoding = "utf-8";
  return iconv.decode(buffer, encoding);
}

// @ts-ignore
export async function walkDirOneLevelFlat(dir, handlers = {}, root = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = { type: "directory", path: path.relative(root, dir) || ".", children: [] };

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const files = await walkDirFlat(fullPath, handlers, root);
      // @ts-ignore
      result.children.push({ type: "directory", path: path.relative(root, fullPath), children: files });
    }
  }
  return result;
}

// @ts-ignore
async function walkDirMain(dir, handlers, indexesBundle, root = dir) {
  console.log("[DIR] Enter:", path.relative(root, dir) || ".");

  const entries = await readdir(dir, { withFileTypes: true });

  // @ts-ignore
  const tasks = entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // @ts-ignore
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

  // @ts-ignore
  const children = (await Promise.all(tasks)).filter(Boolean);
  console.log("[DIR] Leave:", path.relative(root, dir) || ".", "children:", children.length);
  return { type: "directory", path: path.relative(root, dir) || ".", children };
}


// @ts-ignore
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
/**
 * @typedef {Object} AnnotatedItem
 * @property {string} text
 * @property {string} key
 * @property {string} [oldText]     - 변경 전 원문
 * @property {string} [movedFrom]   - 다른 key에서 이동된 경우
 * @property {boolean} [newlyAdded] - 새로 추가된 경우
 * @property {string} [translated]  - 현재 번역
 * @property {string} [oldText_kr]  - 과거 번역
 * @property {boolean} [copied]     - 번역이 원문과 동일한 경우
 */

/**
 * 아이템 변경 사항과 번역 상태를 주석(annotate)합니다.
 *
 * @param {AnnotatedItem[]} items
 * @param {string} dirPath
 * @param {{ oldIndexes: Indexes, krIndexes: Indexes, oldKrIndexes: Indexes }} param2
 * @returns {AnnotatedItem[]}
 */
export function annotateItems(items, dirPath, { oldIndexes, krIndexes, oldKrIndexes }) {
  return items
    .map(item => annotateChange(item, dirPath, oldIndexes))
    .filter(item => item.oldText !== undefined || item.movedFrom !== undefined || item.newlyAdded)
    .map(item => annotateTranslation(item, dirPath, oldIndexes, krIndexes, oldKrIndexes));
}

/**
 * 변경 사항(텍스트 변경, 이동, 추가)을 주석합니다.
 * @param {AnnotatedItem} item
 * @param {string} dirPath
 * @param {Indexes} oldIndexes
 * @returns {AnnotatedItem}
 */
function annotateChange(item, dirPath, oldIndexes) {
  const oldText = findTextByKey(oldIndexes, dirPath, item.key);
  const oldKey = findKeyByText(oldIndexes, dirPath, item.text);

  const base = { ...item };

  if (oldText !== null && oldText !== item.text) {
    base.oldText = oldText;
  } else if (oldText === null && oldKey && oldKey !== item.key) {
    base.movedFrom = oldKey;
  } else if (oldText === null && !oldKey) {
    base.newlyAdded = true;
  }

  return base;
}

/**
 * 번역 상태를 주석합니다.
 * @param {AnnotatedItem} item
 * @param {string} dirPath
 * @param {Indexes} oldIndexes
 * @param {Indexes} krIndexes
 * @param {Indexes} oldKrIndexes
 * @returns {AnnotatedItem}
 */
function annotateTranslation(item, dirPath, oldIndexes, krIndexes, oldKrIndexes) {
  const krText = findTextByKey(krIndexes, dirPath, item.key);
  const oldKrText =
    findTextByKey(oldKrIndexes, dirPath, item.key) ||
    (findKeyByText(oldIndexes, dirPath, item.text)
      ? findTextByKey(oldKrIndexes, dirPath, findKeyByText(oldIndexes, dirPath, item.text) || '')
      : null);

  const t = (/** @type {string | null} */ s) => s?.trim();
  const itemText = t(item.text);
  const kr = t(krText);
  const oldKr = t(oldKrText);

  if (kr && kr === itemText) {
    return { ...item, copied: true };
  }
  if (item.movedFrom) {
    return kr ? { ...item, translated: kr } : { ...item, oldText_kr: oldKr ?? '' };
  }
  if (item.newlyAdded) {
    return { ...item, translated: kr ?? '' };
  }
  if (oldKr !== kr) {
    return { ...item, translated: kr ?? '' };
  }
  return { ...item, oldText_kr: oldKr ?? '' };
}


// =====================
// 파서
// =====================
// @ts-ignore
export function parseUpdateSQLs(sql) {
  const regex = /SET\s+Text\s*=\s*'((?:''|[^'])*)'[\s\S]*?WHERE\s+Tag\s*=\s*'([^']+)'/gi;
  const results = [];
  let match;
  while ((match = regex.exec(sql)) !== null) {
    results.push({ text: match[1].replace(/''/g, "'"), key: match[2] });
  }
  return results;
}

// @ts-ignore
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
    // @ts-ignore
    ".sql": async (_, text) => parseUpdateSQLs(text),
    // @ts-ignore
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
// @ts-ignore
function calcTranslationCount(node) {
  if (node.type === "file" && Array.isArray(node.content)) {
    const total = node.content.length;
    const translated = node.content.filter(
      // @ts-ignore
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
