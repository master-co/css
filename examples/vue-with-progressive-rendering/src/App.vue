<template>
    <div>
        <div class='grid-cols:2 w:fit mx:auto'>
            <a href="https://vuejs.org/" target="_blank">
                <img src="./assets/logo.png" class="logo vue" alt="Vue logo" />
            </a>
            <a href="https://beta.css.master.co" target="_blank">
                <img src="./assets/master.svg" class="logo master scale(1.6)" alt="Master logo" />
            </a>
        </div>
        <h1 class="font:sans ls:-.25 fg:white@dark font:heavy">
            <span class="fg:#41b883">Vue</span>
            <span class="fg:slate-70 mx:10 font:semibold">+</span>
            <span>Master CSS</span>
        </h1>
        <p class="read-the-docs">
            Click on the Vue and Master CSS logos to learn more
        </p>
    </div>
</template>

<style>
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}

.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
    filter: drop-shadow(0 0 2em #61fb67aa);
}

.logo.master:hover {
    filter: drop-shadow(0 0 2em #ecbb40);
}
@font-face {
  font-family: 'Inter';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url('./assets/fonts/Inter-Italic.woff2#iefix') format('woff2'),
    url('./assets/fonts/Inter-Italic.woff') format('woff');
}
.inter {
  font-family: 'Inter';
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
<script>
(async () => {
    const [{ initRuntime }, { default: config }] = await Promise.all([
        import("@master/css"),
        import("../master.css"),
    ]);
    initRuntime(config);
})();
</script>