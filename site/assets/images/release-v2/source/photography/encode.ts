/** Optimized display copies; retain the full-resolution JPEGs as reproducible encoding inputs. */
import sharp from 'sharp'
import { stat } from 'node:fs/promises'
import { leadStory, objectStory } from '../../../../../content/blog/v2/stories'

for (const { image } of [leadStory, objectStory]) {
  const source = new URL(`../../../../../public${image.original}`, import.meta.url)
  const output = new URL(`../../../../../public${image.src}`, import.meta.url)
  await sharp(source.pathname).webp({ quality: 84, effort: 6 }).toFile(output.pathname)
  const [before, after] = await Promise.all([stat(source), stat(output)])
  console.log(`${image.src}: ${before.size} → ${after.size} bytes (${Math.round((1 - after.size / before.size) * 100)}% smaller)`)
}
