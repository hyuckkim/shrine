<script lang="ts">
  import RowInfo from "./RowInfo.svelte";

  export let file: {
    name: string;
    path: string;
    content: any[];
  };
</script>

<h2>📄 {file.name}</h2>

{#if file.content && file.content.length > 0}
  {#each file.content as item}
    <RowInfo {item} />
  {/each}
{:else}
  <p>이 파일에는 비교할 데이터가 없습니다.</p>
{/if}
