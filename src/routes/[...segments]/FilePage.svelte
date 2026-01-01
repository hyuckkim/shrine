<script lang="ts">
  import type { AnnotatedItem } from "../../../fetch-script";
  import RowInfo from "./RowInfo.svelte";

  export let file: {
    name: string;
    path: string;
    parentHref: string | null;
    content: AnnotatedItem[];
  };

  let displayMode: "text" | "rendered" | "diff" = "text";
</script>

<div class="header">
  <h3>📄 {file.name}</h3>
  {#if file.parentHref}
    <a class="back" href={file.parentHref}>⬆️ 상위 디렉토리로</a>
  {/if}
  <button onclick={() => displayMode = displayMode === "text" ? "rendered" : displayMode === "rendered" ? "diff" : "text"}>
    {#if displayMode === "text"}
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text-align-start-icon lucide-text-align-start"><path d="M21 5H3"/><path d="M15 12H3"/><path d="M17 19H3"/></svg>
    {:else if displayMode === "rendered"}
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-icon lucide-list"><path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/></svg>
    {:else if displayMode === "diff"}
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-plus-icon lucide-list-plus"><path d="M16 5H3"/><path d="M11 12H3"/><path d="M16 19H3"/><path d="M18 9v6"/><path d="M21 12h-6"/></svg>
    {/if}

  </button>
</div>

{#if file.content && file.content.length > 0}
  <div class="rows">
    {#each file.content as item}
      <RowInfo
        {item}
        {displayMode}
      />
    {/each}
  </div>
{:else}
  <p>이 파일에는 비교할 데이터가 없습니다.</p>
{/if}

<style>
  .header {
    font-size: 2rem;
    font-weight: bold;
    margin: 0.5rem;
    padding: 0.5rem;
    border-radius: 10px;
    background: #fff9;
  }
  .header h3 {
    margin: 0.5em 0;
  }
  .header button {
    float: right;
    padding: 0.3rem 0.6rem;
    font-size: 0.9rem;
    border: none;
    border-radius: 6px;
    background: #2563eb;
    color: white;
    cursor: pointer;
  }
  .back {
    margin-bottom: 1rem;
    display: inline-block;
    font-size: 1.1rem;
    color: #555;
    text-decoration: none;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
