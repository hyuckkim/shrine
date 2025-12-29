
import FontIconRaw from '$lib/fonticon.json';
import ColorRaw from '$lib/color.json';

const ICON_MAP: Record<string, string> = FontIconRaw;
const COLOR_CONSTANTS: Record<string, string> = ColorRaw;

export function renderCiv5Text(rawText: string): string {
  let result = rawText;

  // A. 특수 줄바꿈 처리
  result = result.replace(/\[NEWLINE\]/g, '<br />');

  // B. RGBA 색상 태그 처리: [COLOR:255:0:0:255]
  result = result.replace(/\[COLOR:(\d+):(\d+):(\d+):(\d+)\]/g, (_, r, g, b, a) => {
    // 알파값이 255 기준으로 들어오므로 0~1 사이로 변환
    return `<span style="color: rgba(${r}, ${g}, ${b}, ${Number(a) / 255});">`;
  });

  // C. 색상 상수 태그 처리: [COLOR_POSITIVE_TEXT]
  // 대문자로 시작하는 모든 COLOR_ 패턴을 찾습니다.
  result = result.replace(/\[(COLOR_[A-Z_]+)\]/g, (_, colorKey) => {
    const colorValue = COLOR_CONSTANTS[colorKey] || 'inherit';
    return `<span style="color: ${colorValue};">`;
  });

  // D. 색상 종료 태그 처리: [ENDCOLOR]
  result = result.replace(/\[ENDCOLOR\]/g, '</span>');

  // E. 아이콘 태그 처리: [ICON_GOLD]
  result = result.replace(/\[(ICON_[A-Z0-9_]+)\]/g, (match, iconKey) => {
    // 아이콘 맵에서 찾아서 태그로 반환, 없으면 원래 텍스트([ICON_...]) 유지
    return ICON_MAP[iconKey] || match;
  });

  return result;
}