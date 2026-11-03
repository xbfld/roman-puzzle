import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
let commit = process.env.VERCEL_GIT_COMMIT_SHA
if (!commit) {
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    commit = 'local'
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_INFO__: JSON.stringify({ version, commit: commit.slice(0, 7), builtAt: new Date().toISOString() }),
  },
  base: process.env.GITHUB_PAGES ? '/roman-puzzle/' : '/',
  build: {
    outDir: 'dist',
  },
})
