import { describe } from 'mocha'
import { expect } from 'chai'
import ts from 'typescript'
import { TypeBuilder } from '../TypeBuilder'
import { TypeStore } from '../TypeStore'
import assert from 'node:assert'
import {
  assertAliasType,
  assertArrayType,
  assertClassType,
  assertEnumType,
  assertFunctionType,
  assertGenericBuiltIn,
  assertInterfaceType,
  assertIntersectionType,
  assertMapType,
  assertObjectType,
  assertPromiseType,
  assertSetType,
  assertTupleType,
  assertUnionType,
  isFunctionType,
} from '../types/guards'
import {
  Type,
  AccessModifier,
  InterfaceType,
  GenericInstance,
  AliasType,
  UnionType,
  TypeParameter,
  StringLiteralType,
  ObjectType,
  FunctionType,
} from '../types'

const fileName = process.cwd() + '/__fixtures__/type-builder.ts'

describe('TypeBuilder', () => {
  const program = ts.createProgram([fileName], {})
  const tc = program.getTypeChecker()
  const tb = new TypeBuilder(program, TypeStore)
  const source = program.getSourceFile(fileName)
  assert(source)
  const module = tc.getSymbolAtLocation(source)
  const exports = tc.getExportsOfModule(module!)

  const prim = exports.find(e => e.name === 'Primitives')
  assert(prim)
  const type = tb.buildType(tc.getDeclaredTypeOfSymbol(prim))()
  assertInterfaceType(type)

  it('generates simple interface', () => {
    expect(type).to.be.instanceof(InterfaceType)
    expect(type.ref).to.equal('__fixtures__/type-builder.ts__Primitives')
    expect(type.extendsTypes).to.have.length(0)
    expect(type.typeParameters).to.have.length(0)
  })

  const primitiveTests: [string, Type][] = [
    ['propNull', Type.Null],
    ['propUndefined', Type.Undefined],
    ['propNever', Type.Never],
    ['propAny', Type.Any],
    ['propUnknown', Type.Unknown],
    ['propSymbol', Type.Symbol],
    ['propUniqSymbol', Type.UniqueSymbol],
  ]
  primitiveTests.map(([propName, expectType]) => {
    it(`generates ${expectType.name} type`, () => {
      const stringProp = type.properties.find(p => p.name === propName)
      expect(stringProp?.type).to.equal(expectType)
    })
  })

  it('generates string type', () => {
    const stringProp = type.properties.find(p => p.name === 'propString')
    expect(stringProp?.type).to.equal(Type.String)
  })

  it('generates number type', () => {
    const prop = type.properties.find(p => p.name === 'propNumber')
    expect(prop?.type).to.equal(Type.Number)
  })

  it('generates big int type', () => {
    const prop = type.properties.find(p => p.name === 'propBigInt')
    expect(prop?.type).to.equal(Type.BigInt)
  })

  it('generates bool type', () => {
    const prop = type.properties.find(p => p.name === 'propBool')
    expect(prop?.type).to.equal(Type.Boolean)
  })

  describe('TypeAlias', () => {
    const prim = exports.find(e => e.name === 'UnionTest')
    assert(prim)
    const type = tb.buildType(tc.getDeclaredTypeOfSymbol(prim))()
    assertAliasType(type)

    it('generates type alias', () => {
      expect(type).to.be.instanceof(AliasType)
      expect(type.ref).to.equal('__fixtures__/type-builder.ts__UnionTest')
    })

    describe('Union Type', () => {
      const uType = type.type as UnionType

      it('generates union type correctly', () => {
        expect(uType).to.be.instanceof(UnionType)
        expect(uType.types[0]).to.equal(Type.String)
        expect(uType.types[1]).to.equal(Type.Number)
      })
    })
  })

  describe('Interface with Type Param', () => {
    const prim = exports.find(e => e.name === 'HasTypeParam')
    assert(prim)
    const type = tb.buildType(tc.getDeclaredTypeOfSymbol(prim))()
    assertInterfaceType(type)

    it('generates type parameter', () => {
      expect(type.typeParameters).to.have.length(1)
      const typeParams = type.typeParameters[0]
      expect(typeParams).to.instanceof(TypeParameter)
      expect(typeParams.name).to.equal('T')
    })

    it('associates type parameter with property', () => {
      const stringProp = type.properties.find(p => p.name === 'propString')
      expect(stringProp?.type).to.be.instanceof(TypeParameter)
    })
  })

  describe('Class', () => {
    const prim = exports.find(e => e.name === 'TestClass')
    assert(prim)
    const type = tb.buildType(tc.getDeclaredTypeOfSymbol(prim))()
    assertClassType(type)

    it('handles class generic param', () => {
      const [param] = type.typeParameters
      expect(type.typeParameters).to.have.length(1)
      expect(param).to.be.instanceof(TypeParameter)
      expect(param.constraint).to.equal(Type.String)
      expect(param.default).to.deep.equal(new StringLiteralType('boo'))
    })

    it('handles public properties', () => {
      const prop = type.properties.find(p => p.name === 'testProp')!
      expect(prop.access).to.equal(AccessModifier.Public)
      expect(prop.isReadOnly).to.equal(false)
      expect(prop.hasSetter).to.equal(false)
      expect(prop.hasGetter).to.equal(false)
      expect(prop.isOptional).to.be.false
    })

    it('handles private properties', () => {
      const prop = type.properties.find(p => p.name === 'privateProp')!
      expect(prop.access).to.equal(AccessModifier.Private)
    })

    it('handles protected properties', () => {
      const prop = type.properties.find(p => p.name === 'protectedProp')!
      expect(prop.access).to.equal(AccessModifier.Protected)
    })

    it('handles readonly properties', () => {
      const prop = type.properties.find(p => p.name === 'readOnlyProp')!
      expect(prop.isReadOnly).to.equal(true)
    })

    it('handles static props', () => {
      const prop = type.static.properties.find(
        p => p.name === 'staticProp',
      )!
      expect(prop.type).to.equal(Type.Number)
    })

    it('handles static method', () => {
      const prop = type.static.methods.find(
        p => p.name === 'staticMethod',
      )!
      expect(prop).to.exist
      expect(prop.signatures[0].returnType).to.equal(Type.Void)
    })

    it('handles implemented types', () => {
      expect(type.implementsTypes[0].name).to.equal('Whimsical')
      expect(type.implementsTypes[1].name).to.equal('Delusional')
    })

    const decorFn = TypeStore.find(
      t => isFunctionType(t) && t.name === 'testDecorator',
    ) as FunctionType
    assert(decorFn)

    it('handles class decorators', () => {
      const decor = type.hasDecorator(decorFn)
      expect(decor).to.be.true
    })

    it('handles property decorators', () => {
      const decor = type.getProperty('testProp').hasDecorator(decorFn)
      expect(decor).to.be.true
    })

    it('handles method decorators', () => {
      const decor = type.getMethod('instanceMethod').hasDecorator(decorFn)
      expect(decor).to.be.true
    })

    it('handles method parameter decorators', () => {
      const decor = type
        .getMethod('instanceMethod')
        .signatures[0].parameters[0].hasDecorator(decorFn)
      expect(decor).to.be.true
    })

    it('handles constructor parameter decorators', () => {
      const decor =
        type.constructors[0].parameters[0].hasDecorator(decorFn)
      expect(decor).to.be.true
    })

    it('handles optional properties', () => {
      expect(type.getProperty('optionalProp').isOptional).to.be.true
    })
  })

  it('handles recursive types', () => {
    const prim = exports.find(e => e.name === 'Recursive')
    assert(prim)
    const type = tb.buildType(tc.getDeclaredTypeOfSymbol(prim))()
    assertInterfaceType(type)

    const val = type.properties.find(p => p.name === 'recursive')
    expect(val?.type).to.equal(type)
  })

  describe('generic instance', () => {
    const prim = exports.find(e => e.name === 'GenericTest')
    assert(prim)
    const type = tb.buildType(tc.getDeclaredTypeOfSymbol(prim))()
    assertAliasType(type)

    let generic = type.type as GenericInstance
    it('is instance of GenericInstance', () => {
      expect(generic).to.be.instanceof(GenericInstance)
    })

    it('handles type arguments', () => {
      expect(generic.typeArguments[0]).to.equal(Type.String)
    })

    it('handles property instantiation', () => {
      const prop = generic.properties.find(p => p.name === 'propString')
      expect(prop?.type).to.equal(Type.String)
    })

    it('handles constructors', () => {
      const ctors = generic.constructors
      expect(ctors).to.have.length(1)
      expect(ctors[0].parameters[0].type).to.equal(Type.String)
    })
  })

  it('handles call signatures in interface', () => {
    const sym = exports.find(e => e.name === 'CallSignatures')
    assert(sym)
    const type = tb.buildType(tc.getDeclaredTypeOfSymbol(sym))()
    assertInterfaceType(type)

    expect(type.callSignatures).to.have.length(2)
    const [first, second] = type.callSignatures

    expect(first.parameters[0].name).to.equal('x')
    expect(first.parameters[0].type).to.equal(Type.String)
    expect(first.returnType).to.equal(Type.Number)
    expect(first.parameters[1].name).to.equal('y')
    expect(first.parameters[1].type).to.equal(Type.Number)

    expect(second.returnType).to.equal(Type.String)
  })

  it('handles method overloads', () => {
    const sym = exports.find(e => e.name === 'Overloads')
    assert(sym)
    const tsType = tc.getDeclaredTypeOfSymbol(sym)
    const type = tb.buildType(tsType)()
    assertInterfaceType(type)

    const property = type.methods.find(p => p.name === 'foo')
    assert(property)
    expect(property.signatures).to.have.length(2)
  })

  it('handles function overloads', () => {
    const sym = exports.find(e => e.name === 'overloadedFunction')
    assert(sym)
    const tsType = tc.getTypeOfSymbolAtLocation(sym, sym.valueDeclaration!)
    const type = tb.buildType(tsType)()
    assertFunctionType(type)

    expect(type.signatures).to.have.length(2)
  })

  it('handles intersections', () => {
    const sym = exports.find(e => e.name === 'IntersectionTest')
    assert(sym)
    const tsType = tc.getDeclaredTypeOfSymbol(sym)
    const type = tb.buildType(tsType)()
    assertAliasType(type)
    assertAliasType(type)
    assertIntersectionType(type.type)

    const [one, two] = type.type.types
    assertObjectType(one)
    assertObjectType(two)
  })

  it('handles generic alias', () => {
    const sym = exports.find(e => e.name === 'GenericAlias')
    assert(sym)
    const tsType = tc.getDeclaredTypeOfSymbol(sym)
    const type = tb.buildType(tsType)()
    assertAliasType(type)

    expect(type.type).to.be.instanceof(ObjectType)
    expect(type.typeParameters).to.have.length(1)
    expect(type.typeParameters[0].name).to.equal('T')
  })

  it('handles union contains', () => {
    const sym = exports.find(e => e.name === 'UnionContains')
    assert(sym)
    const tsType = tc.getDeclaredTypeOfSymbol(sym)
    let type = tb.buildType(tsType)()
    assertAliasType(type)
    type = type.type
    assertUnionType(type)

    expect(type.has(Type.Boolean)).to.be.true
  })

  it('handles tuples', () => {
    const sym = exports.find(e => e.name === 'TupleTest')
    assert(sym)
    const tsType = tc.getDeclaredTypeOfSymbol(sym)
    let type = tb.buildType(tsType)()
    assertAliasType(type)
    type = type.type
    assertTupleType(type)

    expect(type.types[0]).to.equal(Type.String)
    expect(type.types[1]).to.equal(Type.Number)
  })

  it('handles arrays', () => {
    const sym = exports.find(e => e.name === 'ArrayTest')
    assert(sym)
    const tsType = tc.getTypeAtLocation(sym.valueDeclaration!)
    let type = tb.buildType(tsType)()
    assertArrayType(type)

    expect(type.elementType).to.equal(Type.String)
  })

  it('handles maps', () => {
    const sym = exports.find(e => e.name === 'MapTest')
    assert(sym)
    const tsType = tc.getTypeAtLocation(sym.valueDeclaration!)
    let type = tb.buildType(tsType)()
    assertMapType(type)

    expect(type.key).to.equal(Type.String)
    expect(type.value).to.equal(Type.Number)
  })

  it('handles sets', () => {
    const sym = exports.find(e => e.name === 'SetTest')
    assert(sym)
    const tsType = tc.getTypeAtLocation(sym.valueDeclaration!)
    let type = tb.buildType(tsType)()
    assertSetType(type)

    expect(type.value).to.equal(Type.String)
  })

  it('handles promises', () => {
    const sym = exports.find(e => e.name === 'PromiseTest')
    assert(sym)
    const tsType = tc.getTypeAtLocation(sym.valueDeclaration!)
    let type = tb.buildType(tsType)()
    assertPromiseType(type)

    expect(type.resolvesType).to.equal(Type.String)
  })

  it('handles generic builtin', () => {
    const sym = exports.find(e => e.name === 'GenericBuiltIn')
    assert(sym)
    const tsType = tc.getTypeAtLocation(sym.valueDeclaration!)
    let type = tb.buildType(tsType)()
    assertGenericBuiltIn(type)

    expect(type.typeArguments[0]).to.equal(Type.String)
  })

  it('handles enum', () => {
    const sym = exports.find(e => e.name === 'Haha')
    assert(sym)
    const tsType = tc.getDeclaredTypeOfSymbol(sym)
    let type = tb.buildType(tsType)()
    assertEnumType(type)

    expect(type.values).to.deep.equal(['hoohoo', 'heehee', 'hiihii'])
  })
})
