<script lang="ts">
  import type { AnnotatedItem } from "../../../fetch-script";
  import FilterPopover from "./FilterPopover.svelte";
  import RowInfo from "./RowInfo.svelte";
  import type { RowStatus } from "./types";

  let { file }: { file: {
    name: string;
    path: string;
    parentHref: string | null;
    content: AnnotatedItem[];
  }} = $props();

  let displayMode: "text" | "rendered" | "diff" = $state("text");


  const processedItems = $derived(file.content.map(item => {
  let status: RowStatus = "";
  if (item.translated === item.text) status = "technical tag";
  else if (item.translated !== undefined && item.movedFrom) status = "rename applied";
  else if (item.movedFrom) status = "renamed";
  else if (item.translated !== undefined) status = "translated";
  else if (item.newlyAdded) status = "new";
  else if (item.oldText) status = "text changed";
  else if (item.copied) status = "copied";

  return {
    ...item,
    computedStatus: status,
    koreanDisplay: item.copied ? "영어와 같음" : (item.translated || item.oldText_kr || "")
  };
}));

// UI에 표시할 필터 옵션들
const STATUS_OPTIONS: { value: RowStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "#b71c1c" },
  { value: "text changed", label: "Text Changed", color: "#b71c1c" },
  { value: "translated", label: "Translated", color: "#1b5e20" },
  { value: "renamed", label: "Renamed", color: "#e65100" },
  { value: "rename applied", label: "Rename Applied", color: "#1b5e20" },
  { value: "copied", label: "Copied", color: "#424242" },
  { value: "technical tag", label: "Technical Tag", color: "#424242" },
];

let selectedStatuses = $state<RowStatus[]>(STATUS_OPTIONS.map(o => o.value)); 

function toggleStatus(status: RowStatus) {
  if (selectedStatuses.includes(status)) {
    selectedStatuses = selectedStatuses.filter(s => s !== status);
  } else {
    selectedStatuses = [...selectedStatuses, status];
  }
}

const filteredItems = $derived(
  processedItems.filter(item => selectedStatuses.includes(item.computedStatus))
);
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
  <FilterPopover
    {STATUS_OPTIONS}
    bind:selectedStatuses
  />
</div>

{#if file.content && file.content.length > 0}
  <div class="rows">
    {#each filteredItems as item}
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
    vertical-align: middle;
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
