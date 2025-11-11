// src/routes/[...segments]/+page.server.ts
import type { PageServerLoad } from './$types';
import jsontree from '$lib/data.json';

const tree: TranslationTree = jsontree as TranslationTree;
export type TranslationTree = DirectoryNode;

export interface DirectoryNode {
  type: "directory";
  path: string; // 상대 경로
  children: Array<DirectoryNode | FileNode>;
  translationTotal?: number;   // 전체 항목 수
  translationDone?: number;    // 번역 완료 수
}

export interface FileNode {
  type: "file";
  path: string; // 상대 경로
  content: AnnotatedItem[];
  translationTotal?: number;
  translationDone?: number;
}

export interface AnnotatedItem {
  key: string;
  text: string;
  oldText?: string;         // 이전 원문
  movedFrom?: string;       // 다른 키에서 이동된 경우
  newlyAdded?: boolean;     // 새로 추가된 항목
  translated?: string;      // 현재 번역
  oldText_kr?: string;      // 과거 번역
  copied?: boolean;         // 번역이 원문과 동일한 경우
}


interface PageData {
  currentDir: string;
  parentHref: string | null;
  directories: { name: string; href: string }[];
  files: { name: string; href: string }[];
}

function findNodeByPath(root: DirectoryNode, segments: string[]): DirectoryNode | FileNode | null {
  let node: DirectoryNode | FileNode = root;
  for (const seg of segments) {
    if (!('children' in node)) return null;
    const found: DirectoryNode | FileNode | null = node.children.find((child) => {
      const parts = child.path.split('/');
      return parts[parts.length - 1].toLowerCase() === seg.toLowerCase();
    }) ?? null;
    if (!found) return null;
    node = found;
  }
  return node;
}

function getDeepestHref(node: DirectoryNode, baseSegments: string[]): string {
  if (!node.children) return '/' + baseSegments.join('/');

  const subDirs = node.children.filter((c): c is DirectoryNode => c.type === 'directory');
  const subFiles = node.children.filter((c): c is FileNode => c.type === 'file');

  if (subDirs.length === 1 && subFiles.length === 0) {
    const subName = subDirs[0].path.split('/').pop()!;
    return getDeepestHref(subDirs[0], [...baseSegments, subName]);
  }

  return '/' + baseSegments.join('/');
}

function extractNameFromPath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export const load: PageServerLoad = async ({ params }) => {
  const segments = params.segments ? params.segments.split('/') : [];
  const currentNode = findNodeByPath(tree, segments);
  const currentDir = segments.length > 0 ? params.segments : 'root';
  const parentHref = segments.length > 0 ? '/' + segments.slice(0, -1).join('/') : null;

  if (currentNode?.type === 'file') {
    return {
      file: {
        name: extractNameFromPath(currentNode.path),
        path: currentNode.path,
        content: currentNode.content ?? [],
        parentHref
      }
    };
  }

  let directories: { name: string; href: string; translationTotal: number; translationDone: number }[] = [];
  let files: { name: string; href: string; translationTotal: number; translationDone: number }[] = [];

  const translationTotal = currentNode?.translationTotal ?? 0;
  const translationDone = currentNode?.translationDone ?? 0;

  if (currentNode?.children) {
    directories = currentNode.children
      .filter((c): c is DirectoryNode => c.type === 'directory')
      .map((c) => {
        const name = extractNameFromPath(c.path);
        const href = getDeepestHref(c, [...segments, name]);
        return {
          name,
          href,
          translationTotal: c.translationTotal ?? 0,
          translationDone: c.translationDone ?? 0
        };
      });

    files = currentNode.children
      .filter((c): c is FileNode => c.type === 'file')
      .map((c) => {
        const name = extractNameFromPath(c.path);
        return {
          name,
          href: '/' + [...segments, name].join('/'),
          translationTotal: c.translationTotal ?? 0,
          translationDone: c.translationDone ?? 0
        };
      });
  }

  return {
    currentDir,
    parentHref,
    directories,
    files,
    translationTotal,
    translationDone
  } satisfies PageData & { translationTotal: number; translationDone: number };
};