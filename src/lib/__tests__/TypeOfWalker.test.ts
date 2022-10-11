import { TransformationState, TypeOfWalker } from '../TypeOfWalker'
import ts from 'typescript'
import { TypeBuilder } from '../TypeBuilder'
import { TypeStore } from '../TypeStore'
import assert from 'node:assert'
import chai, { expect } from 'chai'

chai.config.truncateThreshold = 2000

const fileName = process.cwd() + '/__fixtures__/typeof-walker.ts'

describe('TypeOfWalker', () => {
  const program = ts.createProgram([fileName], {})
  const tb = new TypeBuilder(program, TypeStore)
  const source = program.getSourceFile(fileName)
  assert(source)

  const result = ts.transform(source, [
    ctx => node => {
      const walker = new TypeOfWalker(
        program,
        node,
        ctx,
        tb,
        new TransformationState(),
      )
      return walker.walk()
    },
  ])
  const out = result.transformed[0]!
  const txt = ts.createPrinter().printFile(out)
  console.log(txt)

  it('inlines simple primitives', () => {
    expect(txt).to.include(`const test1 = __trt.Type.String;`)
  })

  it('inlines simple unions', () => {
    expect(txt).to.include(
      `const test2 = new __trt.UnionType([` +
        `() => __trt.Type.String, ` +
        `() => __trt.Type.Number` +
        `]);`,
    )
  })

  it('inlines built-in array', () => {
    expect(txt).to.include(
      `const testArray = new __trt.ArrayType(() => __trt.Type.String);`,
    )
  })

  it('inlines intersection', () => {
    expect(txt).to.include(
      'const testInt = new __trt.IntersectionType([' +
        '() => new __trt.ObjectType([' +
        'new __trt.Property("a", () => __trt.Type.String, "public", false, false, false, false, [])' +
        '], [], "__type", "", [], [], []), ' +
        '() => new __trt.ObjectType([' +
        'new __trt.Property("b", () => __trt.Type.Number, "public", false, false, false, false, [])' +
        '], [], "__type", "", [], [], [])' +
        ']);',
    )
  })

  it('retrieves class type from store', () => {
    expect(txt).to.include(
      `const test3 = __trt.TypeStore.getOrThrow(` +
        `"__fixtures__/typeof-walker.ts__FooBar");`,
    )
    expect(TypeStore.has('__fixtures__/typeof-walker.ts__FooBar')).true
  })

  it('retrieves interface type from store', () => {
    expect(txt).to.include(
      `const testInterface = __trt.TypeStore.getOrThrow("__fixtures__/typeof-walker.ts__Boohoo");`,
    )
    expect(TypeStore.has('__fixtures__/typeof-walker.ts__Boohoo')).true
  })

  it('retrieves alias from store', () => {
    expect(txt).to.include(
      `const testAlias = __trt.TypeStore.getOrThrow("__fixtures__/typeof-walker.ts__Broom");`,
    )
    expect(TypeStore.has('__fixtures__/typeof-walker.ts__Broom')).true
  })
})
