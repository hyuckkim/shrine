import { describe, it, expect } from 'vitest';
import { annotateItems, buildIndexes, isTechnicalTag } from '../fetch-script';

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
    it('copied: true 는 간단한 띄어쓰기를 무시한다', () => {
      const oldTree = makeTree({ a: 'Hello' });
      const krTree = makeTree({ a: 'Hi     ' });
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
  });
  describe('원문이 빈 문자열로 수정된 경우', () => {
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
  describe('기술적 태그라서 번역된 걸로 표시하려고 함', () => {
    it('중괄호 내부에만 텍스트가 있으면', () => {
      const oldTree = makeTree({});
      const oldKrTree = makeTree({});
      const krTree = makeTree({ a: '{key_text_of_something}' });
      const newItems = [{ key: 'a', text: '{key_text_of_something}' }];

      const result = annotateItems(newItems, dirPath, {
        oldIndexes: buildIndexes(oldTree),
        krIndexes: buildIndexes(krTree),
        oldKrIndexes: buildIndexes(oldKrTree)
      });

      expect(result[0].translated).toBe('{key_text_of_something}'); // 이건 translated
    });
    it('대괄호 내부에만 텍스트가 있으면', () => {
      const oldTree = makeTree({});
      const oldKrTree = makeTree({});
      const krTree = makeTree({ a: '[some_icon]' });
      const newItems = [{ key: 'a', text: '[some_icon]' }];

      const result = annotateItems(newItems, dirPath, {
        oldIndexes: buildIndexes(oldTree),
        krIndexes: buildIndexes(krTree),
        oldKrIndexes: buildIndexes(oldKrTree)
      });

      expect(result[0].translated).toBe('[some_icon]'); // 이건 translated
    });
  it('둘 사이에 다른 특수문자까지도 허용됨', () => {
    const oldTree = makeTree({});
    const oldKrTree = makeTree({});
    const krTree = makeTree({ a: '{##.## 1: key}: [number_icon]' });
    const newItems = [{ key: 'a', text: '{##.## 1: key}: [number_icon]' }];

    const result = annotateItems(newItems, dirPath, {
      oldIndexes: buildIndexes(oldTree),
      krIndexes: buildIndexes(krTree),
      oldKrIndexes: buildIndexes(oldKrTree)
    });

    expect(result[0].translated).toBe('{##.## 1: key}: [number_icon]'); // 이건 translated
  });
  it('안에 한글 있어도 기술적 태그로 인식해야 하는데', () => {
    const oldTree = makeTree({});
    const oldKrTree = makeTree({});
    const krTree = makeTree({ a: '{한글 텍스트}: [number_icon]' });
    const newItems = [{ key: 'a', text: '{한글 텍스트}: [number_icon]' }];

    const result = annotateItems(newItems, dirPath, {
      oldIndexes: buildIndexes(oldTree),
      krIndexes: buildIndexes(krTree),
      oldKrIndexes: buildIndexes(oldKrTree)
    });

    expect(result[0].translated).toBe('{한글 텍스트}: [number_icon]'); // 이건 translated
  });
  it('단어가 있으면 이건 번역을 안 한 것', () => {
    const oldTree = makeTree({});
    const oldKrTree = makeTree({});
    const krTree = makeTree({ a: '{##.## 1: key} icon: [number_icon]' });
    const newItems = [{ key: 'a', text: '{##.## 1: key} icon: [number_icon]' }];

    const result = annotateItems(newItems, dirPath, {
      oldIndexes: buildIndexes(oldTree),
      krIndexes: buildIndexes(krTree),
      oldKrIndexes: buildIndexes(oldKrTree)
    });

    expect(result[0].copied).toBe(true); // 이건 허용되지 않음
  });
  });
});
describe('isTechnicalTag', () => {
  describe('정상적인 기술 태그', () => {
    it('단일 태그', () => {
      expect(isTechnicalTag('{PlayerName}')).toBe(true);
    });

    it('여러 태그 조합', () => {
      expect(isTechnicalTag('{A}[B]{C}')).toBe(true);
    });

    it('태그 + 구분자', () => {
      expect(isTechnicalTag('{Player}:{Enemy}')).toBe(true);
    });

    it('태그 내부에 한글 포함', () => {
      expect(isTechnicalTag('{플레이어}')).toBe(true);
    });

    it('태그 + 숫자', () => {
      expect(isTechnicalTag('{Name} 123')).toBe(true);
    });

    it('태그 + 허용된 구분자', () => {
      expect(isTechnicalTag('{X} - {Y}')).toBe(true);
    });

    it('빈 태그', () => {
      expect(isTechnicalTag('{}')).toBe(true);
    });

    it('공백만 있는 태그', () => {
      expect(isTechnicalTag('{ }')).toBe(true);
    });
  });

  describe('태그 외부에 문자가 있는 경우', () => {
    it('태그 없이 한글만', () => {
      expect(isTechnicalTag('플레이어')).toBe(false);
    });

    it('태그 + 외부 한글', () => {
      expect(isTechnicalTag('{Name} 공격')).toBe(false);
    });

    it('태그 + 외부 영문', () => {
      expect(isTechnicalTag('{Name}abc')).toBe(false);
    });

    it('허용되지 않은 구분자 포함', () => {
      expect(isTechnicalTag('{Name}!{Enemy}')).toBe(false);
    });

    it('이모지 포함', () => {
      expect(isTechnicalTag('{Name}💥')).toBe(false);
    });

    it('CJK 구분자 포함', () => {
      expect(isTechnicalTag('{Name}、{Enemy}')).toBe(false);
    });
  });

  describe('중첩 태그 및 문법 오류', () => {
    it('닫는 괄호 없음', () => {
      expect(isTechnicalTag('{Name')).toBe(false);
    });

    it('여는 괄호 없음', () => {
      expect(isTechnicalTag('Name}')).toBe(false);
    });

    it('중첩된 태그 구조', () => {
      expect(isTechnicalTag('{Name{Inner}}')).toBe(true);
    });

    it('연속 태그', () => {
      expect(isTechnicalTag('{Name}{123}')).toBe(true);
    });

    it('태그 + 공백 + 태그', () => {
      expect(isTechnicalTag('{Name} {123}')).toBe(true);
    });
  });
});