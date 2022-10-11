import ts from 'typescript'
import { ModuleWalker } from './ModuleWalker'
import { TypeBuilder } from './TypeBuilder'
import { TypeStore } from './TypeStore'
import chokidar from 'chokidar'
import path from 'node:path'
import { TypeWriter } from './TypeWriter'
import assert from 'node:assert'
import { trace } from './util'
import { dim, reset } from './console-color'
import { TransformationState, TypeOfWalker } from './TypeOfWalker'

class TypeCompilerOptions {
  defaultTsOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    declaration: true,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    incremental: true,
    types: ['node'],
  }
  tsConfigPath: string = 'tsconfig.json'
  validateTsOptions: () => boolean = () => true
  emitWithErrors = true
  moduleMetadata: { exclude?: string[] } | false = { exclude: [] }
}

function prettyDiag(diag: readonly ts.Diagnostic[]) {
  return ts.formatDiagnosticsWithColorAndContext(diag, {
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
    getCanonicalFileName: (fileName: string) => fileName,
  })
}

type Result = { status: number; entryPoints: string[] }

interface CompileWatcher {
  onCompiled(cb: (result: Result) => void): void
  onError(cb: (err: Error) => void): void
  compile(): void
  close(): void
}

/**
 * Provides compile and watch-compile features.
 * Package consumers should use this class to integrate
 * compilation features into their programs.
 */
export class TypeCompiler {
  protected entryPoints: string[]
  private opts: TypeCompilerOptions
  private parsedOptions: ts.ParsedCommandLine

  constructor(
    entryPoints: string | string[],
    opts?: Partial<TypeCompilerOptions>,
  ) {
    this.entryPoints = Array.isArray(entryPoints)
      ? entryPoints
      : [entryPoints]
    this.opts = new TypeCompilerOptions()
    if (opts) {
      if (opts.moduleMetadata) {
        const exclude = opts.moduleMetadata?.exclude
        if (exclude && typeof this.opts.moduleMetadata === 'object') {
          this.opts.moduleMetadata.exclude = exclude
        }
      }
      if (opts.tsConfigPath) {
        this.opts.tsConfigPath = opts.tsConfigPath
      }
    }

    const parsedOptions = ts.getParsedCommandLineOfConfigFile(
      path.join(process.cwd(), this.opts.tsConfigPath),
      undefined,
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: diagnostic => {
          console.log(prettyDiag([diagnostic]))
        },
      },
    )
    if (!parsedOptions) throw new Error('Invalid Configuration')
    this.parsedOptions = parsedOptions
    trace('parsed options', parsedOptions)
  }

  compile(): Result {
    const error = { status: -1, entryPoints: [] }
    assert(this.parsedOptions)

    let progTime = performance.now()
    const program = ts.createProgram(
      this.entryPoints,
      this.parsedOptions.options,
    )
    const syntDiag = program.getSyntacticDiagnostics()
    const diags = [
      ...program.getDeclarationDiagnostics(),
      ...syntDiag,
      ...program.getSemanticDiagnostics(),
    ]
    progTime = performance.now() - progTime
    console.log(`${dim}Compiled in ${progTime.toFixed(0)}ms${reset}`)
    if (diags.length) {
      console.log(prettyDiag(diags))
      if (syntDiag.length) {
        console.log(`Not emitting due to syntatic errors.`)
        return error
      }
      if (!this.opts.emitWithErrors) return error
    }

    const fileNames = new Set(this.parsedOptions.fileNames)
    const skipModules = !this.opts.moduleMetadata
    const exclude = this.opts.moduleMetadata
      ? this.opts.moduleMetadata.exclude
      : undefined

    const tb = new TypeBuilder(program, TypeStore)
    const state = new TransformationState()
    const transformer =
      (ctx: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
        const fn = sourceFile.fileName
        if (
          !skipModules &&
          !exclude?.some(s => fn.startsWith(s)) &&
          fileNames.has(fn)
        ) {
          const walker = new ModuleWalker(
            program,
            sourceFile,
            ctx,
            tb,
            TypeStore,
          )
          sourceFile = walker.walk()
        }

        if (this.entryPoints.some(s => fn === s)) {
          const rel = this.getRelativeToTypeStore(sourceFile)
          sourceFile = ts.factory.updateSourceFile(sourceFile, [
            ts.factory.createImportDeclaration(
              undefined,
              undefined,
              ts.factory.createStringLiteral(rel),
            ),
            ...sourceFile.statements,
          ])
        }

        const typeOf = new TypeOfWalker(
          program,
          sourceFile,
          ctx,
          tb,
          state,
        )
        sourceFile = typeOf.walk()
        return sourceFile
      }

    let emitTime = performance.now()
    const emitResult = program.emit(
      undefined,
      undefined,
      undefined,
      undefined,
      { before: [transformer] },
    )
    emitTime = performance.now() - emitTime
    console.log(
      `${dim}Emitted in ${emitTime.toFixed(0)}ms ` +
        (diags.length > 0 ? 'with type errors' : '') +
        `${reset}`,
    )
    console.log(`${dim}Collected ${TypeStore.size} types${reset}`)
    // console.log(inspect(TypeStore, { colors: true, depth: 8 }))

    const outDir =
      this.parsedOptions.options.outDir ?? process.cwd() + '/out'
    new TypeWriter(TypeStore, outDir).write()
    const entryResults = []
    for (let entryPoint of this.entryPoints) {
      const d = ts.getOutputFileNames(
        this.parsedOptions,
        entryPoint,
        true,
      )[0]
      entryResults.push(d)
    }
    return { status: 0, entryPoints: entryResults }
  }

  private getRelativeToTypeStore(sourceFile: ts.SourceFile) {
    const out = ts.getOutputFileNames(
      this.parsedOptions,
      sourceFile.fileName,
      true,
    )[0]
    return path
      .relative(
        out,
        this.parsedOptions.options.outDir! + '/' + TypeStore.storePath,
      )
      .slice(1)
  }

  watch(): CompileWatcher {
    const app = this
    let i = 0

    const rootDir = this.parsedOptions.options.rootDir
    assert(rootDir)
    const watcher = chokidar.watch(rootDir)
    const callbacks: Function[] = []
    const errorCallbacks: Function[] = []
    const restart = (path?: string) => {
      if (path) console.log('Changed: ' + path)
      try {
        const result = app.compile()
        for (let callback of callbacks) {
          callback(result)
        }
      } catch (e) {
        for (let callback of errorCallbacks) {
          callback(e)
        }
      }
    }

    watcher.on('ready', () => {
      trace(watcher.getWatched())
      watcher
        .on('add', restart)
        .on('change', restart)
        .on('unlink', restart)
    })

    return {
      onCompiled(cb: (result: Result) => void) {
        callbacks.push(cb)
        if (i === 0) {
          i++
          restart()
        }
      },
      onError(cb: (err: Error) => void) {
        errorCallbacks.push(cb)
      },
      compile() {
        const result = app.compile()
        for (let callback of callbacks) {
          callback(result)
        }
      },
      close() {
        callbacks.length = 0
        return watcher.close()
      },
    }
  }
}
