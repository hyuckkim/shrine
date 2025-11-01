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
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.error("  [ERROR] readdir failed:", dir, err.message);
    return []; // 디렉토리 읽기 실패 시 빈 리스트 반환
  }

  const tasks = entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);

    try {
      if (entry.isDirectory()) {
        return await walkDirFlat(fullPath, handlers, root);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (handlers[ext]) {
          const text = await readFileWithEncoding(fullPath);
          try {
            return await handlers[ext](fullPath, text) || [];
          } catch (handlerErr) {
            console.error("  [ERROR] handler failed:", fullPath, handlerErr.message);
            return [];
          }
        }
      }
      return [];
    } catch (err) {
      console.error("  [ERROR] walkDirFlat entry processing failed:", fullPath, err.message);
      return [];
    }
  });

  try {
    const results = await Promise.all(tasks);
    return results.flat().filter(Boolean);
  } catch (err) {
    console.error("  [ERROR] walkDirFlat Promise.all failed:", dir, err.message);
    return [];
  }
}

async function readFileWithEncoding(fullPath) {
  try {
    const buffer = await readFile(fullPath);
    let encoding = chardet.detect(buffer);
    if (Array.isArray(encoding)) encoding = encoding[0];
    if (encoding) encoding = String(encoding).toLowerCase();
    if (!encoding || !iconv.encodingExists(encoding)) encoding = "utf-8";
    return iconv.decode(buffer, encoding);
  } catch (err) {
    console.error("  [ERROR] readFileWithEncoding failed:", fullPath, err.message);
    return ""; // 읽기 실패 시 빈 문자열 반환 — 호출자에서 빈 결과로 처리
  }
}

export async function walkDirOneLevelFlat(dir, handlers = {}, root = dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.error("  [ERROR] walkDirOneLevelFlat readdir failed:", dir, err.message);
    return { type: "directory", path: path.relative(root, dir) || ".", children: [] };
  }

  const result = { type: "directory", path: path.relative(root, dir) || ".", children: [] };

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dir, entry.name);
    try {
      const files = await walkDirFlat(fullPath, handlers, root);
      result.children.push({ type: "directory", path: path.relative(root, fullPath), children: files });
    } catch (err) {
      console.error("  [ERROR] walkDirOneLevelFlat child processing failed:", fullPath, err.message);
    }
  }
  return result;
}

async function walkDirMain(dir, handlers, indexesBundle, root = dir) {
  console.log("[DIR] Enter:", path.relative(root, dir) || ".");

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.error("  [ERROR] readdir failed:", dir, err.message);
    return { type: "directory", path: path.relative(root, dir) || ".", children: [] };
  }

  const tasks = entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);

    try {
      if (entry.isDirectory()) {
        const subTree = await walkDirMain(fullPath, handlers, indexesBundle, root);
        return subTree.children && subTree.children.length > 0 ? subTree : null;
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!handlers[ext]) {
          console.log("  [SKIP] unsupported ext:", fullPath);
          return null;
        }
        return await processFile(fullPath, ext, handlers, indexesBundle, root, path.relative(root, dir) || ".");
      }
      return null;
    } catch (err) {
      console.error("  [ERROR] walkDirMain entry processing failed:", fullPath, err.message);
      return null;
    }
  });

  try {
    const children = (await Promise.all(tasks)).filter(Boolean);
    console.log("[DIR] Leave:", path.relative(root, dir) || ".", "children:", children.length);
    return { type: "directory", path: path.relative(root, dir) || ".", children };
  } catch (err) {
    console.error("  [ERROR] walkDirMain Promise.all failed:", dir, err.message);
    return { type: "directory", path: path.relative(root, dir) || ".", children: [] };
  }
}


async function processFile(fullPath, ext, handlers, indexesBundle, root, dirPath) {
  console.log("  [FILE] Start:", fullPath);
  if (!handlers[ext]) return null;

  let text;
  try {
    text = await readFileWithEncoding(fullPath);
  } catch (err) {
    console.error("  [ERROR] reading file failed:", fullPath, err.message);
    return null;
  }

  let content;
  try {
    content = await handlers[ext](fullPath, text);
  } catch (err) {
    console.error("  [ERROR] handler threw for file:", fullPath, err.message);
    content = null;
  }

  try {
    if (content && Array.isArray(content)) {
      const annotated = annotateItems(content, dirPath, indexesBundle);
      console.log("  [FILE] Parsed:", fullPath, "items:", annotated.length);
      if (annotated.length > 0) {
        return { type: "file", path: path.relative(root, fullPath), content: annotated };
      }
    } else {
      console.log("  [FILE] Empty or invalid content:", fullPath);
    }
  } catch (err) {
    console.error("  [ERROR] annotating or packaging file failed:", fullPath, err.message);
  }

  return null;
}

// 텍스트 정규화: null/undefined 방어, trim, 연속 공백 단일화
function normalizeTextForCompare(input) {
  if (input === null || input === undefined) return null;
  const s = String(input).trim();
  // 연속 공백을 하나로 줄임(줄바꿈 포함)
  return s.replace(/\s+/g, ' ');
}

// change detection: oldText, movedFrom, newlyAdded 판정
function detectChange(item, dirPath, oldIndexes) {
  const normalizedItemText = normalizeTextForCompare(item.text);
  const oldTextRaw = findTextByKey(oldIndexes, dirPath, item.key);
  const oldText = normalizeTextForCompare(oldTextRaw);

  const oldKeyForText = findKeyByText(oldIndexes, dirPath, item.text); // 원래 로직과 동일한 검색 기준 유지

  const result = { base: { ...item, text: normalizedItemText } };

  // 1) 텍스트가 존재했고 달라진 경우 (oldText 존재 && 값 불일치)
  if (oldText !== null && oldText !== normalizedItemText && oldText !== undefined) {
    result.base.oldText = oldTextRaw; // 원본 표시(정규화 전 원문 보존 필요하면 oldTextRaw 사용)
  }

  // 2) 텍스트는 없지만 같은 텍스트에 매칭되는 oldKey가 있고 키가 다른 경우 -> movedFrom
  if ((oldText === null || oldText === undefined) && oldKeyForText && oldKeyForText !== item.key) {
    result.base.movedFrom = oldKeyForText;
  }

  // 3) 완전히 새로 추가된 경우 (oldText 없고 oldKey도 없음)
  if ((oldText === null || oldText === undefined) && !oldKeyForText) {
    result.base.newlyAdded = true;
  }

  return result.base;
}

// translation 판단: copied / translated / oldText_kr 결정
function determineTranslationStatus(item, dirPath, krIndexes, oldKrIndexes, oldIndexes) {
  // kr 텍스트는 key로 찾는다
  const krRaw = findTextByKey(krIndexes, dirPath, item.key);
  const krText = normalizeTextForCompare(krRaw);

  // oldKrText: 우선 oldKrIndexes에서 직접 찾아보고, 없으면 oldIndexes 기반으로 매칭된 key로 찾아본다
  const oldKrDirect = findTextByKey(oldKrIndexes, dirPath, item.key);
  let oldKrText = normalizeTextForCompare(oldKrDirect);

  if (!oldKrText) {
    const matchedOldKey = findKeyByText(oldIndexes, dirPath, item.text);
    if (matchedOldKey) {
      const oldKrFromMatchedKey = findTextByKey(oldKrIndexes, dirPath, matchedOldKey);
      oldKrText = normalizeTextForCompare(oldKrFromMatchedKey);
    }
  }

  // item.text는 이미 normalize 후 들어온다 (detectChange에서 변경)
  const itemText = normalizeTextForCompare(item.text);

  // 1) 원문과 번역본이 동일한 경우(번역이 원문을 복사한 경우) => copied
  if (krText !== null && krText === itemText) {
    return { ...item, copied: true };
  }

  // 2) movedFrom 인 경우: 우선 krText가 있으면 translated로, 없으면 oldText_kr 사용
  if (item.movedFrom) {
    if (krText) {
      return { ...item, translated: krText };
    }
    return { ...item, oldText_kr: oldKrText ?? '' };
  }

  // 3) newlyAdded 인 경우: 번역본(있으면 translated로) 기록
  if (item.newlyAdded) {
    return { ...item, translated: krText ?? '' };
  }

  // 4) 기본 비교: oldKrText와 현재 krText가 다르면 translated에 krText 저장, 아니면 oldText_kr에 oldKrText 저장
  if (oldKrText !== krText) {
    return { ...item, translated: krText ?? '' };
  }

  return { ...item, oldText_kr: oldKrText ?? '' };
}

// 최종 annotateItems: detectChange -> 필터 -> determineTranslationStatus
function annotateItems(items, dirPath, { oldIndexes, krIndexes, oldKrIndexes }) {
  if (!Array.isArray(items)) return [];

  // 1) 모든 항목의 텍스트 정규화 및 change detection
  const withChanges = items.map(item => {
    try {
      return detectChange(item, dirPath, oldIndexes);
    } catch (err) {
      console.error("  [ERROR] detectChange failed for item:", item && item.key, err.message);
      return null;
    }
  }).filter(Boolean);

  // 2) oldText, movedFrom, newlyAdded 중 하나라도 있는 항목만 남김
  const filtered = withChanges.filter(i => i.oldText !== undefined || i.movedFrom !== undefined || i.newlyAdded);

  // 3) 번역 상태 판정
  return filtered.map(item => {
    try {
      return determineTranslationStatus(item, dirPath, krIndexes, oldKrIndexes, oldIndexes);
    } catch (err) {
      console.error("  [ERROR] determineTranslationStatus failed for item:", item && item.key, err.message);
      // 실패 시 최소한 원본 항목은 반환해 디버깅 가능하게 함
      return item;
    }
  });
}

// =====================
// 파서
// =====================
export function parseUpdateSQLs(sql) {
  try {
    const regex = /SET\s+Text\s*=\s*'((?:''|[^'])*)'[\s\S]*?WHERE\s+Tag\s*=\s*'([^']+)'/gi;
    const results = [];
    let match;
    while ((match = regex.exec(sql)) !== null) {
      results.push({ text: match[1].replace(/''/g, "'"), key: match[2] });
    }
    return results;
  } catch (err) {
    console.error("  [ERROR] parseUpdateSQLs failed:", err.message);
    return [];
  }
}

export function parseRowsXML(xml) {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
    });
    const parsed = parser.parse(xml);

    const results = [];
    if (parsed && parsed.GameData) {
      for (const [langName, langNode] of Object.entries(parsed.GameData)) {
        if (!langName.startsWith("Language_")) continue;
        const rawRow = langNode && langNode.Row ? langNode.Row : null;
        const rows = Array.isArray(rawRow) ? rawRow : rawRow ? [rawRow] : [];
        for (const row of rows) {
          if (!row) continue;
          results.push({
            key: row["@_Tag"],
            text: row.Text,
          });
        }
      }
    }
    return results;
  } catch (err) {
    console.error("  [ERROR] parseRowsXML failed:", err.message);
    return [];
  }
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
