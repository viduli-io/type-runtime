import ts from 'typescript'
import assert from 'node:assert'
import { TypeBuilder } from './lib/TypeBuilder'
import { TypeStore } from './lib/TypeStore'
import { assertAliasType } from './lib/types/guards'

const fileName = '/samples/index-types.ts'

const program = ts.createProgram([process.cwd() + fileName], {
  module: ts.ModuleKind.ES2020,
  target: ts.ScriptTarget.ES2022,
  types: ['node'],
})

const tc = program.getTypeChecker()
const source = program
  .getSourceFiles()
  .find(s => s.fileName.includes(fileName))

function doTha() {
  assert(source)
  const module = tc.getSymbolAtLocation(source)
  const exports = tc.getExportsOfModule(module!)

  const tb = new TypeBuilder(program, TypeStore)
  const type = tb.buildType(tc.getDeclaredTypeOfSymbol(exports[0]))()
  assertAliasType(type)
  console.log(type.type)

  // const type = tc.getTypeOfSymbolAtLocation(
  //   exports[1],
  //   exports[1].declarations![0],
  // )
  // delete type['checker']
  // console.log(type)

  // for (let p of type.getProperties()) {
  //   const type = tc.getTypeOfSymbolAtLocation(p, p.valueDeclaration!)
  //   delete type['checker']
  //   console.log(type)
  //   for (let signature of tc.getSignaturesOfType(
  //     type,
  //     SignatureKind.Construct,
  //   )) {
  //     delete signature['checker']
  //     console.log(signature)
  //   }
  // }
}

doTha()
