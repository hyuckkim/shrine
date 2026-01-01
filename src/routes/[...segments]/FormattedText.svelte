<script lang="ts">
  import { renderCiv5Text } from '../render/formatter';

  export let text: string;
</script>

<div class="text-area">{@html renderCiv5Text(text)}</div>

<style>
  :global(.text-area img) {
    vertical-align: middle;
    width: 1.2em;
    height: 1.2em;
  }
  .text-area {
    background: #000;
    color: #eee;
    border-radius: 10px;
    padding: 0.5rem;
  }
</style>