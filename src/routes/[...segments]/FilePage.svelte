<script lang="ts">
  import type { AnnotatedItem } from "../../../fetch-script";
  import RowInfo from "./RowInfo.svelte";

  export let file: {
    name: string;
    path: string;
    parentHref: string | null;
    content: AnnotatedItem[];
  };
</script>

<div class="header">
  <h3>📄 {file.name}</h3>
  {#if file.parentHref}
    <a class="back" href={file.parentHref}>⬆️ 상위 디렉토리로</a>
  {/if}
</div>

{#if file.content && file.content.length > 0}
  <div class="rows">
    {#each file.content as item}
      <RowInfo
        {item}
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
