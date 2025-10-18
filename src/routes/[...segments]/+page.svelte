<script lang="ts">
  import File from './FilePage.svelte';
  import Folder from './FolderPage.svelte';

  export let data: any;
</script>

{#if data.file}
  <File file={data.file} />
{:else}
  <!-- 기존 디렉토리 뷰 컴포넌트 -->
  <Folder {data} />
{/if}
