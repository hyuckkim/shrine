import { describe, it, expect } from 'vitest';
import { annotateItems, buildIndexes } from '../fetch-script';

// annotateItems 내부에서 쓰는 헬퍼
function findTextByKey(indexes: ReturnType<typeof buildIndexes>, dirPath: string, key: string) {
  return indexes.textByKey.get(`${dirPath}:${key}`) ?? null;
}
function findKeyByText(indexes: ReturnType<typeof buildIndexes>, dirPath: string, text: string) {
  return indexes.keyByText.get(`${dirPath}:${text}`) ?? null;
}
(global as any).findTextByKey = findTextByKey;
(global as any).findKeyByText = findKeyByText;

describe('annotateItems with buildIndexes', () => {
  const dirPath = 'src';

  function makeTree(struct: Record<string, string>, basePath = 'src') {
    return {
      type: 'root',
      path: '.',
      children: [
        {
          type: 'directory',
          path: basePath,
          children: Object.entries(struct).map(([key, text]) => ({
            key,
            text
          }))
        }
      ]
    };
  }

  describe('oldText', () => {
    it('같은 key인데 텍스트가 바뀐 경우 oldText 추가', () => {
      const oldTree = makeTree({ a: 'Hello' });
      const newItems = [{ key: 'a', text: 'Hi' }];

      const result = annotateItems(newItems, dirPath, {
        oldIndexes: buildIndexes(oldTree),
        krIndexes: buildIndexes(makeTree({})),
        oldKrIndexes: buildIndexes(makeTree({}))
      });

      expect(result[0].oldText).toBe('Hello');
    });
  });

  describe('movedFrom', () => {
    it('텍스트는 같지만 key가 달라진 경우 movedFrom 추가', () => {
      const oldTree = makeTree({ a: 'Hello' });
      const newItems = [{ key: 'b', text: 'Hello' }];

      const result = annotateItems(newItems, dirPath, {
        oldIndexes: buildIndexes(oldTree),
        krIndexes: buildIndexes(makeTree({})),
        oldKrIndexes: buildIndexes(makeTree({}))
      });

      expect(result[0].movedFrom).toBe('a');
    });
  });

  describe('원문 상태', () => {
    it('원문이 구버전과 같으면 삭제', () => {
      const oldTree = makeTree({ a: 'Hello' });
      const krTree = makeTree({ a: 'Hello' });
      const newItems = [{ key: 'a', text: 'Hello' }];

      const result = annotateItems(newItems, dirPath, {
        oldIndexes: buildIndexes(oldTree),
        krIndexes: buildIndexes(krTree),
        oldKrIndexes: buildIndexes(makeTree({}))
      });

      expect(result.length).toBe(0);
    });
  });

  describe('newlyAdded', () => {
    it('과거에 없던 key/text라면 newlyAdded true', () => {
      const oldTree = makeTree({});
      const newItems = [{ key: 'c', text: 'New text' }];

      const result = annotateItems(newItems, dirPath, {
        oldIndexes: buildIndexes(oldTree),
        krIndexes: buildIndexes(makeTree({})),
        oldKrIndexes: buildIndexes(makeTree({}))
      });

      expect(result[0].newlyAdded).toBe(true);
    });
  });

  describe('번역 상태', () => {
    it('번역이 원문과 동일하면 copied: true', () => {
      const oldTree = makeTree({ a: 'Hello' });
      const krTree = makeTree({ a: 'Hi' });
      const newItems = [{ key: 'a', text: 'Hi' }];

      const result = annotateItems(newItems, dirPath, {
        oldIndexes: buildIndexes(oldTree),
        krIndexes: buildIndexes(krTree),
        oldKrIndexes: buildIndexes(makeTree({}))
      });

      expect(result[0].copied).toBe(true);
    });

    it('movedFrom인데 번역이 있으면 translated에 저장', () => {
      const oldTree = makeTree({ a: 'Hello' });
      const krTree = makeTree({ b: '안녕' });
      const newItems = [{ key: 'b', text: 'Hello' }];

      const result = annotateItems(newItems, dirPath, {
        oldIndexes: buildIndexes(oldTree),
        krIndexes: buildIndexes(krTree),
        oldKrIndexes: buildIndexes(makeTree({}))
      });

      expect(result[0].translated).toBe('안녕');
    });

    it('newlyAdded인데 번역이 있으면 translated에 저장', () => {
      const oldTree = makeTree({});
      const krTree = makeTree({ c: '추가됨' });
      const newItems = [{ key: 'c', text: 'New text' }];

      const result = annotateItems(newItems, dirPath, {
        oldIndexes: buildIndexes(oldTree),
        krIndexes: buildIndexes(krTree),
        oldKrIndexes: buildIndexes(makeTree({}))
      });

      expect(result[0].translated).toBe('추가됨');
    });

    it('과거 번역과 현재 번역이 다르면 translated에 저장', () => {
      const oldTree = makeTree({ a: 'Hi' });
      const krTree = makeTree({ a: '안녕하세요' });
      const oldKrTree = makeTree({ a: '안녕' });
      const newItems = [{ key: 'a', text: 'Hello' }];

      const result = annotateItems(newItems, dirPath, {
        oldIndexes: buildIndexes(oldTree),
        krIndexes: buildIndexes(krTree),
        oldKrIndexes: buildIndexes(oldKrTree)
      });

      expect(result[0].translated).toBe('안녕하세요');
    });
  });describe('원문이 빈 문자열로 수정된 경우', () => {
  it('번역본도 빈 문자열로 바뀐 경우 translated로 표시된다', () => {
    const oldTree = makeTree({ a: 'Hello' });
    const oldKrTree = makeTree({ a: '안녕' });
    const krTree = makeTree({ a: '' }); // 번역도 빈 문자열
    const newItems = [{ key: 'a', text: '' }]; // 원문이 빈 문자열로 수정됨

    const result = annotateItems(newItems, dirPath, {
      oldIndexes: buildIndexes(oldTree),
      krIndexes: buildIndexes(krTree),
      oldKrIndexes: buildIndexes(oldKrTree)
    });

    expect(result[0].oldText).toBe('Hello');      // 원문 변경 기록
    expect(result[0].translated).toBe(''); // 빈 문자열이 값으로 존재
  });

  it('번역본은 남아있고 원문만 빈 문자열로 바뀐 경우', () => {
    const oldTree = makeTree({ a: 'Hello' });
    const oldKrTree = makeTree({ a: '안녕' });
    const krTree = makeTree({ a: '안녕' }); // 번역은 그대로 유지
    const newItems = [{ key: 'a', text: '' }]; // 원문이 빈 문자열로 수정됨

    const result = annotateItems(newItems, dirPath, {
      oldIndexes: buildIndexes(oldTree),
      krIndexes: buildIndexes(krTree),
      oldKrIndexes: buildIndexes(oldKrTree)
    });

    expect(result[0].oldText).toBe('Hello');       // 원문 변경 기록
    expect(result[0].translated).toBeUndefined(); // 번역된 걸로 치지 않음
  });
});
});