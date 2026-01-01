<script lang="ts">
  import FontIconRaw from '$lib/fonticon.json';

  const fontIcon = FontIconRaw as {
    [key: string]: string;
  };
</script>

<h3>총 {Object.keys(fontIcon).length}개</h3>
<div class="main">
  {#each Object.entries(fontIcon) as [key, element]}
    <div class="icon-card">
      <div class="icon">{@html element}</div>
      <div class="icon-name">[{key}]</div>
    </div>
{/each}
</div>

<style>
  .main {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 15px;
    margin: 20px;
  }
  .icon-card {
    display: flex;
    justify-content: space-between;
    background: rgb(0, 0, 0);
    border: 1px solid #ddd;
    border-radius: 10px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
    padding: 1rem;
  }
  .icon-card:hover {
    transform: scale(1.05);
    box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2);
  }
  .icon-name {
    text-align: center;
    word-break: break-all;
    color: white;
  }
</style>