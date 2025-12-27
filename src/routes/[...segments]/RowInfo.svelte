<script lang="ts">
  export let item: {
    key: string;
    text: string;
    oldText?: string;
    oldKey?: string;
    movedFrom?: string;
    translated?: string;
    oldText_kr?: string;
    copied?: boolean;
    newlyAdded?: boolean;
  };

  let author = ""; // 이름 입력 필드
  $: status = (() => {
    if (item.translated === item.text) return "technical tag";
    if (item.translated !== undefined && item.movedFrom)
      return "rename applied";
    if (item.movedFrom) return "renamed";
    if (item.translated !== undefined) return "translated";
    if (item.newlyAdded) return "new";
    if (item.oldText) return "text changed";
    if (item.copied) return "copied";
    return "";
  })();
</script>

<div class="row">
  <div class="header">
    <div>
      {item.key}
      {#if item.movedFrom}
        <i class="old">← {item.movedFrom}</i>
      {/if}
    </div>
    <div style="display:flex; gap:0.5rem; align-items:center;">
      {#if status}
        <div class="status {status.replace(' ', '-')}">{status}</div>
      {/if}
    </div>
  </div>

  <div class="content">
    <div class="col">
      <div class="label">English</div>
      <div class="text">
        {item.text}
      </div>
      {#if item.oldText}
        <div class="label">English - old</div>
        <div class="text">{item.oldText}</div>
      {/if}
    </div>
    <div class="col">
      <div class="label">Korean</div>
      <div class="text">
        {#if item.newlyAdded && item.translated}
          <!-- 새로 추가된 항목이고 번역이 있으면 우선 표시 -->
          {item.translated}
        {:else if item.translated}
          {item.translated}
        {:else if item.oldText_kr}
          {item.oldText_kr}
        {:else if item.copied}
          <span class="copied">영어와 같음</span>
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
