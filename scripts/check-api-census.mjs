import { readFileSync } from 'node:fs'
import path from 'node:path'
import { checkAPICensus } from './api-census.mjs'

const publicAPIContract = JSON.parse(
  readFileSync(path.resolve('.ai/contracts/public-api.json'), 'utf8')
)

checkAPICensus({
  publicAPIContract: publicAPIContract.packages,
  write: process.argv.includes('--write')
})
