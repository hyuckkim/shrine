<script lang="ts">
  import type { AnnotatedItem } from "../../../fetch-script";
  import RowInfo from "./RowInfo.svelte";

  export let file: {
    name: string;
    path: string;
    parentHref: string | null;
    content: AnnotatedItem[];
  };

  type Suggestion = {
    id: number;
    key: string;
    suggested_text: string;
    author?: string;
    created_at: string;
  };

  let allSuggestions: Record<string, Suggestion[]> | null = null;

  async function loadAllSuggestions() {
    const res = await fetch(
      `/api/suggestions?file=${encodeURIComponent(file.path)}`
    );
    if (res.ok) {
      const suggestions: Suggestion[] = await res.json();
      // key별로 suggestions 그룹화
      allSuggestions = suggestions.reduce<Record<string, Suggestion[]>>((acc, s) => {
        if (!acc[s.key]) acc[s.key] = [];
        acc[s.key].push(s);
        return acc;
      }, {});
    }
    // 데이터베이스가 없을 때: null
    return null;
  }

  // 컴포넌트 마운트 시 suggestions 로드
  import { onMount } from "svelte";
  onMount(() => {
    loadAllSuggestions();
  });
</script>

<div class="header">
  📄 {file.name}
  {#if file.parentHref}
    <a class="back" href={file.parentHref}>⬆️ 상위 디렉토리로</a>
  {/if}
</div>

{#if file.content && file.content.length > 0}
  <div class="rows">
    {#each file.content as item}
      <RowInfo
        {item}
        file_path={file.path}
        suggestions={allSuggestions ? (allSuggestions[item.key] ?? []) : null}
        onSuggestionAdded={loadAllSuggestions}
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
    margin: 1.5rem 0;
    position: sticky;
    top: 84px;
    background: #f9f9f9;
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
