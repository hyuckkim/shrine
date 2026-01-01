<script lang="ts">
  import DiffRow from "./DiffRow.svelte";
  import FormattedText from "./FormattedText.svelte";

  type Item = {
    key: string;
    text: string;
    oldText?: string;
    movedFrom?: string;
    translated?: string;
    oldText_kr?: string;
    copied?: boolean;
    newlyAdded?: boolean;
  };

  let { item, displayMode = "text" }: { item: Item, displayMode?: "text" | "rendered" | "diff" } = $props();

  // 상태 계산 로직
  const status = $derived.by(() => {
    if (item.translated === item.text) return "technical tag";
    if (item.translated !== undefined && item.movedFrom) return "rename applied";
    if (item.movedFrom) return "renamed";
    if (item.translated !== undefined) return "translated";
    if (item.newlyAdded) return "new";
    if (item.oldText) return "text changed";
    if (item.copied) return "copied";
    return "";
  });

  // 한국어 표시용 계산
  const koreanDisplay = $derived(item.copied ? "영어와 같음" : (item.translated || item.oldText_kr || ""));
</script>

{#snippet textView(text: string, isOld: boolean = false)}
  {#if displayMode === "text"}
    <div class="text">{text}</div>
  {:else if displayMode === "rendered"}
    <FormattedText {text} />
  {:else if displayMode === "diff"}
    {#if item.oldText}
      <DiffRow from={item.oldText} to={item.text} mode={isOld ? "removed" : "added"} />
    {:else}
      <div class="text">{text}</div>
    {/if}
  {/if}
{/snippet}

<div class="row">
  <div class="header">
    <div>
      {item.key}
      {#if item.movedFrom}<i class="old">← {item.movedFrom}</i>{/if}
    </div>
    {#if status}
      <div class="status {status.replace(' ', '-')}">{status}</div>
    {/if}
  </div>
  <div class="content">
    <div class="col">
      <div class="label">English</div>
      {@render textView(item.text)}

      {#if item.oldText}
        <div class="label">English - old</div>
        {@render textView(item.oldText, true)}
      {/if}
    </div>

    <div class="col">
      <div class="label">Korean</div>
      <div class:copied-text={item.copied}>
        {#if displayMode === "rendered" && !item.copied}
          <FormattedText text={koreanDisplay} />
        {:else}
          <div class="text">{koreanDisplay}</div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  i {
    color: #999;
  }
  .row {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    margin: 0 0.5rem;
    background: #fffa;
    backdrop-filter: blur(15px) saturate(150%);
  }
  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.8rem;
    font-weight: bold;
    align-items: center;
  }
  .status {
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    text-transform: uppercase;
  }
  .renamed {
    background: #ffe0b2;
    color: #e65100;
  }
  .text-changed {
    background: #ffcdd2;
    color: #b71c1c;
  }
  .translated {
    background: #c8e6c9;
    color: #1b5e20;
  }
  .rename-applied {
    background: #c8e6c9;
    color: #1b5e20;
  }
  .technical-tag {
    background: #e0e0e0;
    color: #424242;
  }
  .copied {
    background: #e0e0e0;
    color: #424242;
  }
  .new {
    background: #ffcdd2;
    color: #b71c1c;
  }
  .content {
    display: flex;
    gap: 1rem;
  }
  .col {
    flex: 1;
  }
  .label {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.3rem;
  }
  .text {
    white-space: pre-wrap;
  }
  .toggle-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #1976d2;
  }
  .status {
    white-space: nowrap;
    flex-shrink: 0;
  }
  .header > div:first-child {
    word-break: break-all;
    flex-shrink: 1;
    min-width: 0;
  }
  .header {
    flex-wrap: wrap;
  }
  .text {
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  @media (max-width: 600px) {
    .content {
      flex-direction: column;
    }
  }
</style>
