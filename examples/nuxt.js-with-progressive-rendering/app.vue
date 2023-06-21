<script>
(async () => {
    const [{ MasterCSS }, { default: config }] = await Promise.all([
        import("@master/css"),
        import("./master.css"),
    ]);
    new MasterCSS(config);
})();
</script>

<template>
    <NuxtWelcome class="{font:32!;font:heavy!;my:20;ls:-.02em}_h1@sm" />
</template>
