<script lang="ts">
  import { onMount } from "svelte";
  import { replaceState } from "$app/navigation";
  import FormattedText from "./FormattedText.svelte";
  import { page } from "$app/state";

  let valueA = "This is a [COLOR_RED]red text[ENDCOLOR] with an [ICON_TEAM_2] icon.";
  let valueB = "This is a [COLOR_BLUE]blue text[ENDCOLOR] with an [ICON_TEAM_7] icon.";
  let copied = false;
  let mounted = false;

  // 1. 초기 로드 시 Hash 읽기 (Base64 디코딩)
  onMount(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const params = new URLSearchParams(hash);
        if (params.has("data")) {
          const [a, b] = JSON.parse(decodeURIComponent(atob(params.get("data")!)));
          valueA = a;
          valueB = b;
        }
      } catch (e) {
        console.error("데이터 복원 실패:", e);
      }
    }
  });

  // 2. 값 변경 시 URL 업데이트 (데이터 보존용)
  $: if (typeof window !== "undefined" && mounted) {
    const dataStr = btoa(encodeURIComponent(JSON.stringify([valueA, valueB])));
    const newHash = `#data=${dataStr}`;
    if (window.location.hash !== newHash) {
      replaceState(newHash, page.state);
    }
  }

  // 3. 링크 복사 기능
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch (err) {
      alert("복사 실패");
    }
  }
</script>

<div class="toolbar">
  <button on:click={copyLink} class:success={copied}>
    {copied ? "Link Copied!" : "Copy Share Link"}
  </button>
</div>

<div class="main">
  <div class="item">
    <div class="preview"><FormattedText text={valueA} /></div>
    <textarea bind:value={valueA} placeholder="Text A..."></textarea>
  </div>

  <div class="item">
    <div class="preview"><FormattedText text={valueB} /></div>
    <textarea bind:value={valueB} placeholder="Text B..."></textarea>
  </div>
</div>

<style>
  .toolbar {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #333;
  }
  button {
    padding: 0.5rem 1rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }
  button.success { background: #059669; }
  
  .main {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: 1fr 1fr;
    padding: 1.5rem;
  }
  .item { display: flex; flex-direction: column; gap: 0.75rem; }
  .preview {
    min-height: 120px;
    padding: 1rem;
    background: #0a0a0a;
    border: 1px solid #333;
    border-radius: 8px;
  }
  textarea {
    height: 150px;
    background: #1a1a1a;
    color: #fff;
    border: 1px solid #444;
    padding: 0.75rem;
    font-family: monospace;
  }
</style>