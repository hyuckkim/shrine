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
  };

  // 상태 라벨 계산
  $: status = (() => {
    if (item.movedFrom) return "renamed";
    if (item.oldText) return "text changed";
    if (item.translated) return "translated";
    if (item.copied) return "copied";
    return "";
  })();
</script>

<style>
  i {
    color: #999;
  }
  .row {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    background: #fff;
  }
  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.8rem;
    font-weight: bold;
  }
  .status {
    font-size: 0.9rem;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
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
  .copied {
    background: #e0e0e0;
    color: #424242;
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
</style>

<div class="row">
  <div class="header">
    <div>{item.key}
        {#if item.movedFrom}
          <i class="old">← {item.movedFrom}</i>
        {/if}
    </div>
    {#if status}
      <div class="status {status.replace(' ', '-')}">{status}</div>
    {/if}
  </div>
  <div class="content">
    <div class="col">
      <div class="label">English</div>
      <div class="text">
        {item.text}
        {#if item.oldText}
          <div class="old"><div><b>Old</b></div> {item.oldText}</div>
        {/if}
      </div>
    </div>
    <div class="col">
      <div class="label">Korean</div>
      <div class="text">
        {#if item.translated}
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
