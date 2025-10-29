// src/routes/[...segments]/+page.server.ts
import type { PageServerLoad } from './$types';
import tree from '$lib/data.json';
import { redirect } from '@sveltejs/kit';

interface PageData {
  currentDir: string;
  parentHref: string | null;
  directories: { name: string; href: string }[];
  files: { name: string; href: string }[];
}

function findNodeByPath(root: any, segments: string[]) {
  let node = root;
  for (const seg of segments) {
    if (!node.children) return null;
    node = node.children.find((child: any) => {
      const parts = child.path.split('/');
      return parts[parts.length - 1].toLowerCase() === seg.toLowerCase();
    });
    if (!node) return null;
  }
  return node;
}

function getDeepestHref(node: any, baseSegments: string[]): string {
  if (!node.children) return '/' + baseSegments.join('/');

  const subDirs = node.children.filter((c: any) => c.type === 'directory');
  const subFiles = node.children.filter((c: any) => c.type === 'file');

  if (subDirs.length === 1 && subFiles.length === 0) {
    const subName = subDirs[0].path.split('/').pop();
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
      .filter((c: any) => c.type === 'directory')
      .map((c: any) => {
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
      .filter((c: any) => c.type === 'file')
      .map((c: any) => {
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