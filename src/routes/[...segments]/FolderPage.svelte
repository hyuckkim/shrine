<script lang="ts">
  export let data: {
    currentDir: string;
    parentHref: string | null;
    directories: { name: string; href: string; translationTotal?: number; translationDone?: number }[];
    files: { name: string; href: string; translationTotal?: number; translationDone?: number }[];
    translationTotal?: number;
    translationDone?: number;
  };
</script>

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
  .header div {
    font-size: 1.2rem;
    font-weight: normal;
    color: blue;
  }
  .back {
    display: inline-block;
    font-size: 1.1rem;
    padding: 0.5rem 0;
    color: #555;
    text-decoration: none;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    margin: 0.5rem 0;
  }
  a {
    display: block;
    padding: 1.2rem 1.5rem;
    margin: 0 0.5rem;
    border-radius: 10px;
    font-size: 1.3rem;
    font-weight: 500;
    text-decoration: none;
    box-sizing: border-box;
    transition: all 0.2s ease-in-out;
  }
  a.dir {
    background: #eef4ff99;
    color: #1a3d8f;
  }
  a.dir:hover {
    background: #dbe4ff99;
  }
  a.file {
    background: #f9f9f999;
    color: #333;
  }
  a.file:hover {
    background: #eee9;
  }
</style>

<div class="header">
  <h3>📂 {data.currentDir}</h3>
{#if typeof data.translationTotal === 'number' && typeof data.translationDone === 'number'}
  <div>
    번역 완료: {data.translationDone} / {data.translationTotal}
  </div>
{/if}
{#if data.parentHref}
  <a class="back" href={data.parentHref}>⬆️ 상위 디렉토리로</a>
{/if}
</div>

<ul>
  {#each data.directories as dir}
    <li>
      <a class="dir" href={dir.href}>
        📂 {dir.name}
        {#if typeof dir.translationTotal === 'number' && typeof dir.translationDone === 'number'}
          <span style="float:right;font-size:1rem;color:#1a3d8f;">{dir.translationDone} / {dir.translationTotal}</span>
        {/if}
      </a>
    </li>
  {/each}

  {#each data.files as file}
    <li>
      <a class="file" href={file.href}>
        📄 {file.name}
        {#if typeof file.translationTotal === 'number' && typeof file.translationDone === 'number'}
          <span style="float:right;font-size:1rem;color:#333;">{file.translationDone} / {file.translationTotal}</span>
        {/if}
      </a>
    </li>
  {/each}
</ul>