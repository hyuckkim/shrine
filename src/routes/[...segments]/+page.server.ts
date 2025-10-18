// src/routes/[...segments]/+page.server.ts
import type { PageServerLoad } from './$types';
import tree from '$lib/data.json';

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

export const load: PageServerLoad = async ({ params }) => {
  const segments = params.segments ? params.segments.split('/') : [];
  const currentNode = findNodeByPath(tree, segments);

  const currentDir = segments.length > 0 ? segments[segments.length - 1] : 'root';
  const parentHref = segments.length > 0 ? '/' + segments.slice(0, -1).join('/') : null;

  if (currentNode?.type === 'file') {
    const parts = currentNode.path.split('/');
    const name = parts[parts.length - 1];
    return {
      file: {
        name,
        path: currentNode.path,
        content: currentNode.content ?? [],
        parentHref   // ⬅️ 추가
      }
    };
  }

  let directories: { name: string; href: string }[] = [];
  let files: { name: string; href: string }[] = [];

  if (currentNode && currentNode.children) {
    directories = currentNode.children
      .filter((c: any) => c.type === 'directory')
      .map((c: any) => {
        const parts = c.path.split('/');
        const name = parts[parts.length - 1];
        return { name, href: '/' + [...segments, name].join('/') };
      });

    files = currentNode.children
      .filter((c: any) => c.type === 'file')
      .map((c: any) => {
        const parts = c.path.split('/');
        const name = parts[parts.length - 1];
        return { name, href: '/' + [...segments, name].join('/') };
      });
  }

  return { currentDir, parentHref, directories, files } satisfies PageData;
};
