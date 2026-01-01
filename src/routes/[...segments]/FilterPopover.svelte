<script lang="ts">
  import type { RowStatus } from "./types";

  let isOpen = $state(false);

  let { STATUS_OPTIONS, selectedStatuses = $bindable() }: {
    STATUS_OPTIONS: { value: RowStatus; label: string; color: string }[];
    selectedStatuses: RowStatus[]
  } = $props();

  function toggleStatus(status: RowStatus) {
    if (selectedStatuses.includes(status)) {
      selectedStatuses = selectedStatuses.filter(s => s !== status);
    } else {
      selectedStatuses = [...selectedStatuses, status];
    }
  }
</script>

<span class="filter-container">
  <button onclick={() => (isOpen = !isOpen)} class="filter-trigger" aria-label="필터 토글">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-funnel-icon lucide-funnel"><path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/></svg>
  </button>

  {#if isOpen}
    <div class="popover">
      <div class="popover-header">
        <strong>상태 필터</strong>
        <button onclick={() => (selectedStatuses = STATUS_OPTIONS.map(o => o.value))}>전체 선택</button>
      </div>
      
      <div class="status-list">
        {#each STATUS_OPTIONS as option}
          <label class="status-item">
            <input 
              type="checkbox" 
              checked={selectedStatuses.includes(option.value)}
              onchange={() => toggleStatus(option.value)}
            />
            <span class="status-badge" style="background: {option.color}22; color: {option.color}">
              {option.label}
            </span>
          </label>
        {/each}
      </div>
    </div>
  {/if}
</span>

<style>
  .filter-container {
    position: relative;
    float: right;
    vertical-align: middle;
  }
  .filter-container button {
    padding: 0.3rem 0.6rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    margin-right: 0.5rem;
  }
  
  .popover {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 100;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 0.8rem;
    min-width: 200px;
    margin-top: 0.5rem;
  }

  .popover-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.8rem;
    font-size: 0.9rem;
  }

  .status-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .status-badge {
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
  }
</style>