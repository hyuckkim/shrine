<script lang="ts">
  import { diffChars, diffWords } from "diff";
  export let from: string;
  export let to: string;

  export let mode: 'added' | 'removed' = 'removed';
  $: diffs = to.includes('.') ? diffWords(from, to) : diffChars(from, to);
</script>

<div class="diff-row">
  {#each diffs as part}
    {#if (mode === 'added' && part.added) || (mode === 'removed' && part.removed) || (!part.added && !part.removed)}
      <span class:added={part.added} class:removed={part.removed}>
        {part.value}
      </span>
    {/if}
  {/each}
</div>

<style>
  .added {
    background-color: #d4f8d4;
  }
  .removed {
    background-color: #f8d4d4;
  }
</style>