import { ModuleWalker } from '../ModuleWalker'
import ts from 'typescript'
import { TypeBuilder } from '../TypeBuilder'
import { TypeStore } from '../TypeStore'
import assert from 'node:assert'
import {
  isAliasType,
  isArrayType,
  isClassType,
  isFunctionType,
  isInterfaceType,
  isVariableDeclaration,
} from '../types/guards'
import { expect } from 'chai'
import {
  AliasType,
  ArrayType,
  ClassType,
  FunctionType,
  InterfaceType,
  Type,
} from '../types'
import { VariableDeclaration } from '../types/declarations'

const fileName = process.cwd() + '/__fixtures__/module-walker.ts'

describe('ModuleWalker', () => {
  const program = ts.createProgram([fileName], {})
  const tb = new TypeBuilder(program, TypeStore)
  const source = program.getSourceFile(fileName)
  assert(source)

  ts.transform(source, [
    ctx => node => {
      const walker = new ModuleWalker(program, node, ctx, tb, TypeStore)
      return walker.walk()
    },
  ])
  const module = TypeStore.modules.find(f => f.fileName === fileName)!

  it('exports function overloads', () => {
    const fn = module.declarations.find(
      d => isFunctionType(d) && d.name === 'overloadedFunction',
    ) as FunctionType
    expect(fn).to.exist
    expect(fn.signatures).length(2)
  })

  it('exports interface', () => {
    const t = module.declarations.find(
      d => isInterfaceType(d) && d.name === 'Primitives',
    ) as InterfaceType

    expect(t).to.exist
  })

  it('exports alias', () => {
    const t = module.declarations.find(
      d => isAliasType(d) && d.name === 'UnionTest',
    ) as AliasType

    expect(t).to.exist
  })

  it('exports test class', () => {
    const t = module.declarations.find(
      d => isClassType(d) && d.name === 'TestClass',
    ) as ClassType

    expect(t).to.exist
  })

  it('exports const value', () => {
    const t = module.declarations.find(
      d => isVariableDeclaration(d) && d.name === 'ArrayTest',
    ) as VariableDeclaration

    expect(t).to.exist
    expect(t.isConstant).true
    expect(t.type.is(ArrayType.of(Type.String))).true
  })

  it('exports let value', () => {
    const t = module.declarations.find(
      d => isVariableDeclaration(d) && d.name === 'letTest',
    ) as VariableDeclaration

    expect(t).to.exist
    expect(t.isConstant).false
  })

  it('exports const function', () => {
    const t = module.declarations.find(
      d => isVariableDeclaration(d) && d.name === 'lambda',
    ) as VariableDeclaration

    expect(t).to.exist
  })

  it('handles default export', () => {
    expect(module.default).instanceof(ClassType)
  })
})
