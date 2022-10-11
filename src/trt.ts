#!/usr/bin/env node
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import { TypeCompiler } from './lib/TypeCompiler'
import path from 'node:path'
import { spawn } from 'child_process'
import { dim, reset } from './lib/console-color'

yargs(hideBin(process.argv))
  .option('tsConfig', {
    alias: 'c',
    type: 'string',
    description: 'Path to tsconfig file',
  })
  .command(
    'watch [script]',
    'start a watch compiler and run script',
    yargs => {
      return yargs.positional('script', {
        describe: 'script to run',
        type: 'string',
      })
    },
    argv => {
      console.log(argv)
      if (!argv.script) {
        console.error('Script path not specified.')
        return
      }
      watchAndRestart(argv.script, { tsConfig: argv.tsConfig })
    },
  )
  .command(
    'run [script]',
    'compiler and run entry script',
    yargs => {
      return yargs.positional('script', {
        describe: 'script to run',
        type: 'string',
      })
    },
    argv => {
      if (!argv.script) {
        console.error('Script path not specified.')
        return
      }
      runOnce(argv.script, { tsConfig: argv.tsConfig })
    },
  )
  .showHelpOnFail(true)
  .parse()

function runOnce(entry: string, args: { tsConfig?: string } = {}) {
  if (!entry.startsWith('/')) entry = path.join(process.cwd(), entry)

  let result
  try {
    result = new TypeCompiler([entry], {
      tsConfigPath: args.tsConfig ?? 'tsconfig.json',
    }).compile()
  } catch (e) {
    console.error(e)
    return -1
  }

  if (result.status > -1) {
    const run = spawn(
      'node',
      [
        '--enable-source-maps',
        '--loader',
        'ts-node/esm',
        result.entryPoints[0],
      ],
      {
        stdio: 'inherit',
      },
    )
    run.on('close', code => {
      console.log(
        `\n${dim}%s${reset}`,
        `Child process exited with code ${code}.`,
      )
    })
  }
}

function watchAndRestart(entry: string, args: { tsConfig?: string } = {}) {
  if (!entry.startsWith('/')) entry = path.join(process.cwd(), entry)

  const watcher = new TypeCompiler([entry], {
    tsConfigPath: args.tsConfig ?? 'tsconfig.json',
  }).watch()

  process.stdin.on('data', data => {
    const text = data.toString()
    if (text === 'rs\n') {
      console.log('Re-compiling and re-starting process...')
      watcher.compile()
    }
  })

  watcher.onError(err => {
    console.error(err)
  })
  watcher.onCompiled(result => {
    if (result.status > -1) {
      console.log(`${dim}Executing file...${reset}\n`)
      const run = spawn(
        'node',
        [
          '--enable-source-maps',
          '--loader',
          'ts-node/esm',
          result.entryPoints[0],
        ],
        {
          stdio: 'inherit',
        },
      )
      run.on('close', code => {
        console.log(
          `\n${dim}%s${reset}`,
          `Child process exited with code ${code}. Waiting for changes...`,
        )
      })
    }
  })
}
