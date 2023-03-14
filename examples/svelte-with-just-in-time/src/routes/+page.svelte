<script>
    import Counter from "./Counter.svelte";
    import welcome from "$lib/images/svelte-welcome.webp";
    import welcome_fallback from "$lib/images/svelte-welcome.png";
</script>

<svelte:head>
    <title>Svelte Kit + Master CSS</title>
    <meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
    <h1>
        <span class="welcome">
            <picture>
                <source srcset={welcome} type="image/webp" />
                <img src={welcome_fallback} alt="Welcome" />
            </picture>
        </span>
        <span class="ls:-.25 font:semibold fg:slate-20">
            Svelte Kit v1 + Master CSS v2
            <img src="/master.svg" alt="Master Logo" class="mt:-35 mb:-25 v:middle" width="90" height="90" />
        </span>
    </h1>

    <h2>
        try editing <strong>src/routes/+page.svelte</strong>
    </h2>

    <Counter />
</section>

<style>
    section {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex: 0.6;
    }

    h1 {
        width: 100%;
    }

    .welcome {
        display: block;
        position: relative;
        width: 100%;
        height: 0;
        padding: 0 0 calc(100% * 495 / 2048) 0;
    }

    .welcome img {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        display: block;
    }
</style>
