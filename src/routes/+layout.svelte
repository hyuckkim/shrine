<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>
<style>
	header { display: flex; position: sticky;
    top: 0; background-color: #f9f9f9; padding: 2px; z-index: 1000; }
	p {
		color: #333;
		background-color: #f9f9f9;
		border-radius: 5px;
		padding: 10px;
		margin: 10px 4px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s;
	}
</style>

<header>
<p>❤️ by handanikr: <br>
	<a href="https://github.com/handanikr/vp_kr">
	https://github.com/handanikr/vp_kr</a>
</p>
<p>
	🗺️ by LoneGazebo: <br>
	<a href="https://github.com/LoneGazebo/Community-Patch-DLL">
	https://github.com/LoneGazebo/Community-Patch-DLL</a>
</p>
</header>
<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
