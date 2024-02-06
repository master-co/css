import { Bench, Options } from 'tinybench'

export default async function benchmark(name: string, tasks: Record<string, () => void | Promise<void>>, options?: Options, afterRun?: (bench: Bench) => void) {
    test(name, async () => {
        const bench = new Bench(options)
        for (const [taskName, task] of Object.entries(tasks)) {
            bench.add(taskName, task)
        }
        await bench.warmup()
        await bench.run()
        console.table(bench.table())
        afterRun?.(bench)
    })
}