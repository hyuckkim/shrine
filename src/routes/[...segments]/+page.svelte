<script lang="ts">
  import type { AnnotatedItem } from '../../../fetch-script';
  import File from './FilePage.svelte';
  import Folder from './FolderPage.svelte';

  type FileData = {
    file: {
      name: string;
      path: string;
      content: AnnotatedItem[];
      parentHref: string | null;
    }
  };

  type FolderData = {
    currentDir: string;
    parentHref: string | null;
    directories: { name: string; href: string }[];
    files: { name: string; href: string }[];
  };

  export let data: FileData | FolderData;
  function isFileData(data: unknown): data is FileData {
    return (data as FileData).file !== undefined;
  }
</script>

{#if isFileData(data)}
  <File file={data.file} />
{:else}
  <Folder {data} />
{/if}
