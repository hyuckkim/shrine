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

  export let file_path: string;
  export let suggestions: { id: number; suggested_text: string; author?: string; created_at: string }[] = [];
  export let onSuggestionAdded: () => void;

  let showSuggestions = false;
  let suggestion = "";
  let author = ""; // 이름 입력 필드
  $: status = (() => {
    if (item.translated === item.text) return "technical tag";
    if (item.translated !== undefined && item.movedFrom) return "rename applied";
    if (item.movedFrom) return "renamed";
    if (item.translated !== undefined) return "translated";
    if (item.newlyAdded) return "new";
    if (item.oldText) return "text changed";
    if (item.copied) return "copied";
  return "";
})();

  async function submitSuggestion() {
    if (!suggestion.trim()) return;
    await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_path,
        key: item.key,
        suggested_text: suggestion,
        author: author || "익명"
      })
    });
    suggestion = "";
    author = "";
    onSuggestionAdded();
  }
</script>

<style>
  i { color: #999; }
  .row { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #fff; }
  .header { display: flex; justify-content: space-between; margin-bottom: 0.8rem; font-weight: bold; align-items: center; }
  .status { font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 6px; text-transform: uppercase; }
  .renamed { background: #ffe0b2; color: #e65100; }
  .text-changed { background: #ffcdd2; color: #b71c1c; }
  .translated { background: #c8e6c9; color: #1b5e20; }
  .rename-applied { background: #c8e6c9; color: #1b5e20; }
  .technical-tag { background:#e0e0e0; color:#424242; }
  .copied { background: #e0e0e0; color: #424242; }
  .new { background: #ffcdd2; color: #b71c1c; }
  .content { display: flex; gap: 1rem; }
  .col { flex: 1; }
  .label { font-size: 0.8rem; color: #666; margin-bottom: 0.3rem; }
  .text { white-space: pre-wrap; }
  .toggle-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #1976d2; }
  .suggestion-block { margin-top: 1rem; border-top: 1px solid #eee; padding-top: 0.8rem; }
  .suggestion-block textarea { width: 100%; min-height: 60px; margin-bottom: 0.5rem; }
  .suggestion-block button { background: #1976d2; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; }
  .suggestion-block ul { margin: 0.5rem 0 0; padding-left: 1.2rem; font-size: 0.9rem; }
  .suggestion-block li { margin-bottom: 0.3rem; background: #f9f9f9; padding: 0.3rem 0.5rem; border-radius: 4px; }
  .suggestion-block input {
    width: 100%;
    margin-bottom: 0.5rem;
    padding: 0.4rem;
  }
</style>

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
      <button class="toggle-btn" on:click={() => { showSuggestions = !showSuggestions; }}>
        {showSuggestions ? "−" : "+"}
      </button>
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

  <div class="suggestion-block">
  {#if showSuggestions}
      <h4>번역 제안하기</h4>
      <input type="text" placeholder="이름 (선택)" bind:value={author} />
      <textarea bind:value={suggestion} placeholder="제안할 번역을 입력하세요..."></textarea>
      <button on:click={submitSuggestion}>저장</button>

  {/if}
  {#if suggestions.length > 0}
    <ul>
      {#each suggestions as s}
        <li>{s.suggested_text} <small>({s.author ?? "익명"}, {new Date(s.created_at).toLocaleString()})</small></li>
      {/each}
    </ul>
  {/if}
  </div>
</div>
