<script>
  import FormattedText from "./FormattedText.svelte";

  let value = "This is a [COLOR_BLUE]blue text[ENDCOLOR] with an [ICON_SWORD] icon.";
</script>
<FormattedText text={value} />

<textarea rows="6" cols="60" bind:value></textarea>