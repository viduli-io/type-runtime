import { TypeStore } from './TypeStore'
import ts, { ScriptTarget } from 'typescript'
import { TypeExpressionFactory } from './TypeExpressionFactory'
import * as prettier from 'prettier'
import { writeFileSync } from 'fs'
import path from 'node:path'

const _ = undefined

/**
 * Write TypeStore to a importable file.
 */
export class TypeWriter {
  constructor(
    protected store: typeof TypeStore,
    protected outDir: string,
  ) {}

  write() {
    const factory = new TypeExpressionFactory()
    let sf = ts.createSourceFile(
      'temp.ts',
      `const __trt = require('type-runtime');\n`,
      ScriptTarget.ES2020,
    )
    // sf = ts.factory.updateSourceFile(sf, [
    //   factory.makeLibImport(),
    //   ...sf.statements,
    // ])
    const results: ts.Expression[] = []
    for (let type of this.store.types) {
      results.push(factory.makeTypeExpression(type))
    }
    sf = ts.factory.updateSourceFile(sf, [
      ...sf.statements,
      factory.makeTypeStoreLoad(results),
    ])
    const printer = ts.createPrinter()
    const srcText = prettier.format(printer.printFile(sf), {
      semi: true,
      parser: 'typescript',
      printWidth: 100,
    })
    writeFileSync(path.join(this.outDir, this.store.storePath), srcText)
  }
}
