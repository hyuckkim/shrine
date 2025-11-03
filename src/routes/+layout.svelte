<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  let { children } = $props();
</script>

<header>
  <p>
    ❤️ by handanikr: <br />
    <a href="https://github.com/handanikr/vp_kr">
      https://github.com/handanikr/vp_kr</a
    >
  </p>
  <p>
    🗺️ by LoneGazebo: <br />
    <a href="https://github.com/LoneGazebo/Community-Patch-DLL">
      https://github.com/LoneGazebo/Community-Patch-DLL</a
    >
  </p>
</header>

<svelte:head>
  <link rel="icon" href={favicon} />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

{@render children?.()}

<style>
  :global(html, body) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  header {
    display: flex;
    flex-wrap: wrap; /* 줄바꿈 허용 */
    gap: 8px;
    align-items: flex-start;
    position: sticky;
    top: 0;
    background-color: #f9f9f9;
    padding: 8px; /* 모바일에서 너무 크면 줄임 */
    z-index: 1000;
  }

  header > p {
    flex: 1 1 auto; /* 필요 시 늘어나고 줄어들게 */
    min-width: 0; /* 중요한 설정: 자식이 줄바꿈 못하는 문제 해결 */
    color: #333;
    background-color: #f9f9f9;
    border-radius: 5px;
    padding: 8px;
    margin: 0; /* header의 gap으로 간격 조절 */
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
    overflow-wrap: anywhere; /* 긴 단어/URL 줄바꿈 허용 */
    word-break: break-word;
  }

  header a {
    color: inherit;
    word-break: break-all; /* 링크가 길면 줄바꿈 */
  }

  /* 좁은 화면에서는 세로 스택으로 바꿈 (선택적) */
  @media (max-width: 480px) {
    header {
      padding: 6px;
    }
    header > p {
      flex-basis: 100%;
    }
  }
</style>
