import ts from 'typescript'
import { TypeBuilder } from './TypeBuilder'
import { ESModule } from './types'
import { TypeStore } from './TypeStore'
import { VariableDeclaration } from './types/declarations'
import { hasFlag, inspectFlags } from './util'
import assert from 'node:assert'
import { ModuleContent } from './types/ESModule'

/**
 * Typescript Transformer that collects type information of
 * each module.
 */
export class ModuleWalker {
  protected checker: ts.TypeChecker
  module?: ESModule

  constructor(
    protected program: ts.Program,
    protected sourceFile: ts.SourceFile,
    protected ctx: ts.TransformationContext,
    protected tb: TypeBuilder,
    protected store: typeof TypeStore,
  ) {
    this.checker = program.getTypeChecker()
  }

  walk() {
    const tsModule = this.checker.getSymbolAtLocation(this.sourceFile)!
    const exports = this.checker.getExportsOfModule(tsModule)
    let _default
    const declarations = new Array<() => ModuleContent>()
    for (const ex of exports) {
      let dec = ex.valueDeclaration ?? ex.declarations?.[0]
      if (dec && ts.isExportSpecifier(dec)) {
        const s = this.checker.getExportSpecifierLocalTargetSymbol(dec)
        dec = s ? s.valueDeclaration ?? s.declarations?.[0] : dec
      }
      assert(dec)
      let tsType =
        ts.isFunctionLike(dec) || ts.isVariableDeclaration(dec)
          ? this.checker.getTypeAtLocation(dec)
          : this.checker.getDeclaredTypeOfSymbol(ex)
      if ((tsType as any).intrinsicName === 'error') {
        // sometimes getDeclaredTypeOfSymbol can fail
        tsType = this.checker.getTypeAtLocation(dec)
      }
      const type = this.tb.buildType(tsType)
      let content
      if (ts.isVariableDeclaration(dec)) {
        const isLet = hasFlag(dec.parent.flags, ts.NodeFlags.Let)
        const isConst = hasFlag(dec.parent.flags, ts.NodeFlags.Const)
        if (!(isLet || isConst)) continue
        if (!ts.isIdentifier(dec.name)) continue
        const varDec = new VariableDeclaration(
          dec.name.text,
          isConst,
          type,
        )
        content = () => varDec
      } else {
        content = type as () => ModuleContent
      }
      if (ex.name === 'default') _default = content
      if (content) declarations.push(content)
    }
    const module = new ESModule(
      this.sourceFile.fileName,
      this.sourceFile.fileName,
      declarations,
      _default,
    )
    this.store.add(module)
    this.module = module
    return this.sourceFile
  }
}
