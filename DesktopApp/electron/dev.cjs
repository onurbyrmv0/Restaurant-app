/**
 * Electron dev runner — Starts Vite dev server, then launches Electron.
 * Usage: node electron/dev.cjs
 */
const { exec, spawn } = require('child_process')
const path = require('path')

const rootDir = path.join(__dirname, '..')

console.log('🔧 Vite dev server başladılır...\n')

const viteProcess = exec('npx vite --port 5173', { cwd: rootDir })

let electronStarted = false

viteProcess.stdout.on('data', (data) => {
  process.stdout.write(data)

  const output = data.toString()
  if (!electronStarted && (output.includes('Local:') || output.includes('localhost:5173'))) {
    electronStarted = true

    // Vite tam hazır olana qədər kiçik gecikmə
    setTimeout(() => {
      console.log('\n🚀 Electron başladılır...\n')

      const electronPath = require('electron')
      const electronProcess = spawn(electronPath, ['.'], {
        cwd: rootDir,
        env: { ...process.env, VITE_DEV_SERVER_URL: 'http://localhost:5173' },
        stdio: 'inherit',
      })

      electronProcess.on('close', (code) => {
        console.log(`\nElectron bağlandı (code: ${code})`)
        viteProcess.kill()
        process.exit(0)
      })
    }, 1500)
  }
})

viteProcess.stderr.on('data', (data) => {
  process.stderr.write(data)
})

viteProcess.on('close', (code) => {
  if (!electronStarted) {
    console.error(`❌ Vite xətası ilə dayandı (code: ${code})`)
    process.exit(code || 1)
  }
})

// Ctrl+C ilə düzgün bağlama
process.on('SIGINT', () => {
  viteProcess.kill()
  process.exit(0)
})
