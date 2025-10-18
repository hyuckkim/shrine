<script lang="ts">
  export let data: {
    currentDir: string;
    parentHref: string | null;
    directories: { name: string; href: string }[];
    files: { name: string; href: string }[];
  };
</script>

<style>
  .header {
    font-size: 2rem;
    font-weight: bold;
    margin: 1.5rem 0;
  }
  .back {
    margin-bottom: 1rem;
    display: inline-block;
    font-size: 1.1rem;
    color: #555;
    text-decoration: none;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    margin: 1rem 0;
  }
  a {
    display: block;
    padding: 1.2rem 1.5rem;
    border-radius: 10px;
    font-size: 1.3rem;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.2s;
  }
  a.dir {
    background: #eef4ff;
    color: #1a3d8f;
  }
  a.dir:hover {
    background: #dbe4ff;
  }
  a.file {
    background: #f9f9f9;
    color: #333;
  }
  a.file:hover {
    background: #eee;
  }
</style>

<div class="header">📂 {data.currentDir}</div>

{#if data.parentHref}
  <a class="back" href={data.parentHref}>⬆️ 상위 디렉토리로</a>
{/if}

<ul>
  {#each data.directories as dir}
    <li><a class="dir" href={dir.href}>📂 {dir.name}</a></li>
  {/each}

  {#each data.files as file}
    <li><a class="file" href={file.href}>📄 {file.name}</a></li>
  {/each}
</ul>