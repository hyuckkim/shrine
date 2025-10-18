<script lang="ts">
  import RowInfo from "./RowInfo.svelte";

  export let file: {
    name: string;
    path: string;
    parentHref: string | null;
    content: any[];
  };
</script>

<style>
  .header {
    font-size: 2rem;
    font-weight: bold;
    margin: 1.5rem 0;
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
    gap: 1rem;
  }
</style>

<div class="header">📄 {file.name}</div>

{#if file.parentHref}
  <a class="back" href={file.parentHref}>⬆️ 상위 디렉토리로</a>
{/if}

{#if file.content && file.content.length > 0}
  <div class="rows">
    {#each file.content as item}
      <RowInfo {item} file_path={file.parentHref || '.'} />
    {/each}
  </div>
{:else}
  <p>이 파일에는 비교할 데이터가 없습니다.</p>
{/if}
