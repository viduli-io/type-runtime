import ts, {
  ObjectFlags,
  SymbolFlags,
  SyntaxKind,
  TypeFlags,
} from 'typescript'
import assert from 'assert'
import {
  getTypeFlags,
  hasFlag,
  inspectSymbol,
  inspectTsType,
  trace,
  warn,
} from './util'
import {
  AccessModifier,
  AliasType,
  ArrayType,
  CallSignature,
  ClassLocation,
  ClassType,
  ConstructSignature,
  Decorator,
  ExternalType,
  FunctionType,
  GenericBuiltIn,
  GenericInstance,
  Int8ArrayType,
  InterfaceType,
  IntersectionType,
  MapType,
  Method,
  NumberLiteralType,
  ObjectType,
  Parameter,
  PromiseType,
  Property,
  SetType,
  Statics,
  StringLiteralType,
  TupleType,
  Type,
  TypeParameter,
  UnionType,
  EnumType,
  IndexSignature,
} from './types'
import * as path from 'path'
import { TypeStore } from './TypeStore'

function isObjectType(tsType: ts.Type): tsType is ts.ObjectType {
  return hasFlag(tsType.flags, TypeFlags.Object)
}

function isAnonymous(tsType: ts.Type): tsType is ts.ObjectType {
  return (
    isObjectType(tsType) &&
    hasFlag(tsType.objectFlags, ObjectFlags.Anonymous)
  )
}

function isTupleType(tsType?: ts.Type): tsType is ts.TupleType {
  return (
    !!tsType &&
    'elementFlags' in tsType &&
    'minLength' in tsType &&
    'hasRestElement' in tsType
  )
}

function isTypeReference(tsType: ts.Type): tsType is ts.TypeReference {
  return (
    isObjectType(tsType) &&
    hasFlag(tsType.objectFlags, ObjectFlags.Reference)
  )
}

function isInterface(tsType: ts.ObjectType): tsType is ts.InterfaceType {
  return hasFlag(tsType.objectFlags, ObjectFlags.Interface)
}

const firstDec = (s: ts.Symbol) =>
  s.valueDeclaration ?? s.declarations?.[0]

class BuildContext {
  protected stack = new Set<string>()
}

type IdOpts = { primitives?: boolean; preferAlias?: boolean }

Error.stackTraceLimit = 100

/**
 * Builds a `Type` (or one of its subclasses) given a typescript
 * type. Fully follows relationships and builds related types as well.
 */
export class TypeBuilder extends BuildContext {
  protected cwd: string
  protected tc: ts.TypeChecker

  constructor(
    protected program: ts.Program,
    protected typeStore: typeof TypeStore,
  ) {
    super()
    this.cwd = program.getCurrentDirectory()
    this.tc = program.getTypeChecker()
  }

  buildType(tsType: ts.Type): () => Type {
    if (!tsType) {
      console.error('expected a type')
      console.error(this.stack)
      throw new Error('Unhandled, unavailable type')
    }
    const alias = tsType.aliasSymbol
    trace(
      'handling ts type. flags: ' +
        getTypeFlags(tsType) +
        '. symbol: ' +
        (alias ?? tsType.symbol)?.name,
    )
    trace(this.stack)
    if (alias && !(tsType.flags & ts.TypeFlags.EnumLiteral)) {
      trace('detected alias ' + alias.name)
      const id = this.calculateId(tsType, { preferAlias: true })
      if (id && (this.stack.has(id) || TypeStore.has(id))) {
        trace(
          `using type store retriever for alias ${alias.name}, id ${id}`,
        )
        return () => TypeStore.getOrThrow(id)
      }
      if (id) this.stack.add(id)

      let genericAlias
      const aliasDec = firstDec(alias)
      if (aliasDec) {
        trace('handling alias dec')
        genericAlias = this.buildType(this.tc.getTypeAtLocation(aliasDec))
      }

      const value = this.getInner(tsType)
      const params =
        tsType.aliasTypeArguments?.map(
          t => this.buildType(t) as () => TypeParameter,
        ) ?? []

      const typeAlias = new AliasType(
        id,
        alias.name,
        value,
        params,
        genericAlias,
      )
      TypeStore.add(typeAlias)
      if (id) this.stack.delete(id)
      return () => typeAlias
    }
    return this.getInner(tsType)
  }

  private getInner(tsType: ts.Type): () => Type {
    const { flags } = tsType
    if (hasFlag(flags, TypeFlags.Any)) {
      return () => Type.Any
    } else if (hasFlag(flags, TypeFlags.Never)) {
      return () => Type.Never
    } else if (hasFlag(flags, TypeFlags.Void)) {
      return () => Type.Void
    } else if (hasFlag(flags, TypeFlags.Null)) {
      return () => Type.Null
    } else if (hasFlag(flags, TypeFlags.Undefined)) {
      return () => Type.Undefined
    } else if (hasFlag(flags, TypeFlags.Unknown)) {
      return () => Type.Unknown
    } else if (hasFlag(flags, TypeFlags.String)) {
      return () => Type.String
    } else if (hasFlag(flags, TypeFlags.Number)) {
      return () => Type.Number
    } else if (hasFlag(flags, TypeFlags.Boolean)) {
      return () => Type.Boolean
    } else if (hasFlag(flags, TypeFlags.BigInt)) {
      return () => Type.BigInt
    } else if (hasFlag(flags, TypeFlags.ESSymbol)) {
      return () => Type.Symbol
    } else if (hasFlag(flags, TypeFlags.UniqueESSymbol)) {
      return () => Type.UniqueSymbol
    } else if (tsType.isNumberLiteral()) {
      const v = new NumberLiteralType(tsType.value)
      return () => v
    } else if (tsType.isStringLiteral()) {
      const v = new StringLiteralType(tsType.value)
      return () => v
    } else if (hasFlag(flags, TypeFlags.BooleanLiteral)) {
      const v =
        (tsType as any).intrinsicName === 'true' ? Type.True : Type.False
      return () => v
    } else if (isObjectType(tsType)) {
      return this.handleObjectType(tsType)
    } else if (
      tsType.isUnion() &&
      tsType.flags & ts.TypeFlags.EnumLiteral
    ) {
      return this.handleEnumType(tsType)
    } else if (tsType.isUnion()) {
      return this.handleUnionType(tsType)
    } else if (tsType.isIntersection()) {
      const v = new IntersectionType(
        tsType.types.map(t => this.buildType(t)),
      )
      return () => v
    } else if (hasFlag(flags, TypeFlags.IndexedAccess)) {
      return () => Type.Unsupported
    } else if (tsType.isTypeParameter()) {
      return this.handleTypeParam(tsType)
    } else {
      return () => Type.Unsupported
      // console.error(inspectTsType(tsType))
      // throw new Error('not implemented')
    }
  }

  private handleTypeParam(tsType: ts.TypeParameter) {
    trace(`handling type parameter`)
    const tsConstraint = tsType.getConstraint()
    const tsDefault = tsType.getDefault()
    const v = new TypeParameter(
      tsType.symbol.name,
      tsConstraint && this.buildType(tsConstraint),
      tsDefault && this.buildType(tsDefault),
    )
    return () => v
  }

  private handleFunctionParam(params: readonly ts.Symbol[]) {
    return params.map((param: ts.Symbol) => {
      trace(`handling param ${param.name}`)
      const dec = param.valueDeclaration! as ts.ParameterDeclaration
      const type = this.buildType(this.tc.getTypeAtLocation(dec))
      const decor = this.handleDecorators(ts.getDecorators(dec) ?? [])
      return new Parameter(
        param.name,
        type,
        !!(dec.questionToken || dec.initializer),
        decor,
      )
    })
  }

  private handleMember(s: ts.Symbol) {
    trace(`handling member: ${s.name}`)
    const { tc } = this
    const dec = s.valueDeclaration ?? s.declarations?.[0]
    if (!dec) {
      trace('No declaration found', inspectSymbol(s))
    }
    let isReadOnly = false
    let access = s.name.startsWith('#')
      ? AccessModifier.Private
      : AccessModifier.Public
    if (dec) {
      const mods = ts.getModifiers(dec as ts.HasModifiers) ?? []
      for (let mod of mods) {
        switch (mod.kind) {
          case SyntaxKind.PublicKeyword:
            access = AccessModifier.Public
            break
          case SyntaxKind.PrivateKeyword:
            access = AccessModifier.Private
            break
          case SyntaxKind.ProtectedKeyword:
            access = AccessModifier.Protected
            break
        }
        if (mod.kind === SyntaxKind.ReadonlyKeyword) {
          isReadOnly = true
        }
      }
    }
    const tsType = dec
      ? tc.getTypeOfSymbolAtLocation(s, dec)
      : tc.getDeclaredTypeOfSymbol(s)
    if (hasFlag(s.flags, ts.SymbolFlags.Method)) {
      assert(dec)
      const callSigs = this.getCallSigs(tsType)
      const decor = this.getDecoratorsFromDec(dec as ts.MethodDeclaration)
      return new Method(s.name, access, callSigs, decor)
    } else {
      const type = this.buildType(tsType)
      const hasGetter = hasFlag(s.flags, ts.SymbolFlags.GetAccessor)
      const hasSetter = hasFlag(s.flags, ts.SymbolFlags.SetAccessor)
      isReadOnly = isReadOnly || (hasGetter && !hasSetter)
      const isOptional = hasFlag(s.flags, ts.SymbolFlags.Optional)
      const decor = this.getDecoratorsFromDec(
        dec as ts.PropertyDeclaration,
      )
      return new Property(
        s.name,
        type,
        access,
        hasGetter,
        hasSetter,
        isReadOnly,
        isOptional,
        decor,
      )
    }
  }

  private handleUnionType(tsType: ts.UnionType) {
    const v = new UnionType(tsType.types.map(t => this.buildType(t)))
    return () => v
  }

  private handleObjectType(
    tsType: ts.ObjectType | ts.InterfaceType,
  ): () => Type {
    const id = this.calculateId(tsType)
    trace(`object type id ${id || 'incalculable'}`)

    const dec = tsType.symbol && firstDec(tsType.symbol)
    let name = tsType.symbol?.name
    if (dec && ts.isClassDeclaration(dec) && dec.name) {
      name = dec.name.text
    }

    const typeArgs = isTypeReference(tsType)
      ? this.tc.getTypeArguments(tsType as ts.TypeReference)
      : []

    if (id.includes('node_modules/typescript/lib/')) {
      // handle built-in types first
      const type = this.getBuiltInObject(name, typeArgs)
      if (type) {
        trace(`Returning canned built-in type ${type.kind} ${type.name}`)
        return () => type
      }
    }
    if (id.includes('node_modules')) {
      const type = this.getExternalStub(tsType, id, typeArgs)
      if (type) {
        trace(`Returning external type stub ${type.kind} ${type.name}`)
        return () => type
      }
    }
    // this type is or has been built, just return a ref
    if (id && (TypeStore.has(id) || this.stack.has(id))) {
      trace('returning type store activator for ' + id)
      return () => TypeStore.getOrThrow(id)
    }

    if (id) this.stack.add(id)
    trace('handling object type ', name)
    let target
    if (isTypeReference(tsType)) target = tsType.target

    if (isTupleType(target)) {
      const args = this.tc.getTypeArguments(tsType as ts.GenericType)
      const v = new TupleType(args.map(t => this.buildType(t)))
      this.stack.delete(id)
      return () => v
    } else if (hasFlag(tsType.symbol.flags, SymbolFlags.Function)) {
      trace('object subtype - function', tsType.symbol?.name)
      const func = new FunctionType(
        this.getCallSigs(tsType),
        tsType.symbol.name,
        id,
      )
      if (id) TypeStore.add(func)
      this.stack.delete(id)
      return () => func
    }

    const props = []
    const methods = []
    const typeProps = tsType.getProperties()
    for (const prop of typeProps) {
      const m = this.handleMember(prop)
      if (m instanceof Property) {
        props.push(m)
      } else {
        methods.push(m)
      }
    }
    let idx = tsType.getStringIndexType()
    const stringIdxType = idx && this.buildType(idx)
    idx = tsType.getNumberIndexType()
    const numberIdxType = idx && this.buildType(idx)
    const indexSigs = []
    if (numberIdxType)
      indexSigs.push(new IndexSignature(() => Type.Number, numberIdxType))
    if (stringIdxType)
      indexSigs.push(new IndexSignature(() => Type.String, stringIdxType))

    if (tsType.isClass()) {
      return this.handleClass(tsType, id, name, props, methods, indexSigs)
    }

    const ctors = this.getCtorSigs(tsType)
    const callSigs = this.getCallSigs(tsType)
    if (isInterface(tsType)) {
      return this.handleInterface(
        tsType,
        id,
        name,
        props,
        methods,
        ctors,
        callSigs,
        indexSigs,
      )
    }
    if (id === 'samples/mapped-types.ts____type') {
      console.error('here', id)
    }
    let result: Type & { ref: string }
    if (hasFlag(tsType.symbol.flags, SymbolFlags.TypeLiteral)) {
      if (
        props.length === 0 &&
        methods.length === 0 &&
        ctors.length === 0 &&
        callSigs.length > 0
      ) {
        // special case - function alias
        trace('object subtype - function alias')
        result = new FunctionType(callSigs, name, id)
      } else {
        result = new ObjectType(
          props,
          methods,
          name,
          id,
          ctors,
          callSigs,
          indexSigs,
        )
      }
    } else if (target) {
      trace('object subtype - generic instantiation')
      // generic instantiation case
      result = new GenericInstance(
        props,
        methods,
        this.buildType(target),
        typeArgs.map(t => this.buildType(t)),
        name,
        id,
        ctors,
        indexSigs,
      )
    } else {
      trace('object subtype - object')
      result = new ObjectType(
        props,
        methods,
        name,
        id,
        ctors,
        callSigs,
        indexSigs,
      )
    }
    if (id) TypeStore.add(result)
    this.stack.delete(id)
    return () => result
  }

  private getCallSigs(tsType: ts.Type) {
    const callSigs: CallSignature[] = []
    for (let callSig of tsType.getCallSignatures()) {
      callSigs.push(
        new CallSignature(
          this.handleFunctionParam(callSig.parameters),
          this.buildType(callSig.getReturnType()),
        ),
      )
    }
    trace(`found call sigs ` + callSigs.length)
    return callSigs
  }

  private handleInterface(
    tsType: ts.InterfaceType,
    id: string,
    name: string | undefined,
    props: Property[],
    methods: Method[],
    ctors: ConstructSignature[],
    callSigs: CallSignature[],
    indexSigs: IndexSignature[],
  ) {
    trace('object subtype - interface')
    const extendedTypes = this.tc
      .getBaseTypes(tsType)
      .map(t => this.buildType(t))
    const typeParams =
      tsType.typeParameters?.map(t => this.handleTypeParam(t)()) ?? []
    const interfaceType = new InterfaceType(
      id,
      name ?? '',
      props,
      methods,
      extendedTypes,
      ctors,
      callSigs,
      typeParams,
      indexSigs,
    )
    TypeStore.add(interfaceType)
    this.stack.delete(id)
    return () => interfaceType
  }

  private getCtorSigs(ctorSigType: ts.Type) {
    const ctors: ConstructSignature[] = []
    for (let sig of ctorSigType.getConstructSignatures()) {
      ctors.push(
        new ConstructSignature(
          this.handleFunctionParam(sig.getParameters()),
          this.buildType(sig.getReturnType()),
        ),
      )
    }
    trace(`found ${ctors.length} ctor sigs`)
    return ctors
  }

  private handleClass(
    tsType: ts.InterfaceType,
    id: string,
    name: string | undefined,
    props: Property[],
    methods: Method[],
    indexSigs: IndexSignature[],
  ) {
    trace('object subtype - class')
    const baseType = tsType.getBaseTypes()?.[0]
    const superType = (() => {
      if (baseType) {
        trace('calculating super type of class')
        return this.buildType(baseType)
      }
    })()
    const dec = this.getClassDec(tsType)
    const decorators = this.getDecoratorsFromDec(
      dec as ts.ClassDeclaration,
    )
    const heritage = dec?.heritageClauses?.find(
      h => h.token == ts.SyntaxKind.ImplementsKeyword,
    )
    const implementedTypes =
      heritage?.types.map(t =>
        this.buildType(this.tc.getTypeAtLocation(t)),
      ) ?? []

    const ctorImport = this.getCtorImport(tsType)
    if (ctorImport) trace('found ctor export', ctorImport)
    const typeParams =
      tsType.typeParameters?.map(tp => this.handleTypeParam(tp)()) ?? []

    const ctorSigType = this.tc.getTypeOfSymbolAtLocation(
      tsType.symbol,
      dec!,
    )
    const ctors = this.getCtorSigs(ctorSigType)
    const staticProps = ctorSigType.getProperties()
    const statics: Statics = {
      methods: [],
      properties: [],
    }
    for (let prop of staticProps) {
      if (hasFlag(prop.flags, ts.SymbolFlags.Prototype)) continue
      const m = this.handleMember(prop)
      if (m instanceof Property) {
        statics.properties.push(m)
      } else {
        statics.methods.push(m)
      }
    }
    const classType = new ClassType(
      id,
      name ?? '',
      props,
      methods,
      superType as () => ClassType,
      implementedTypes,
      typeParams,
      ctorImport,
      ctors,
      decorators,
      statics,
      indexSigs,
    )
    TypeStore.add(classType)
    this.stack.delete(id)
    return () => classType
  }

  private getDecoratorsFromDec(dec: ts.HasDecorators | undefined) {
    if (!dec) return []
    const decor = ts.getDecorators(dec)
    const decorators = decor ? this.handleDecorators(decor) : []
    trace(`${decorators.length} decorators`)
    return decorators
  }

  private handleDecorators(decor: readonly ts.Decorator[]) {
    const results = []
    for (const d of decor) {
      let name, type
      if (ts.isIdentifier(d.expression)) {
        name = d.expression.text
        type = this.tc.getTypeAtLocation(d.expression)
      } else if (ts.isCallExpression(d.expression)) {
        if (ts.isIdentifier(d.expression.expression)) {
          name = d.expression.expression.text
          type = this.tc.getTypeAtLocation(d.expression.expression)
        }
      }
      if (!type) throw new Error('Unsupported decorator')
      results.push(
        new Decorator(this.buildType(type) as () => FunctionType),
      )
    }
    return results
  }

  private getBuiltInObject(name: string, typeArgs: readonly ts.Type[]) {
    let v: Type | undefined
    if (name === 'Promise') {
      v = new PromiseType(this.buildType(typeArgs[0]))
    } else if (name === 'Array') {
      v = new ArrayType(this.buildType(typeArgs[0]))
    } else if (name === 'ReadonlyArray') {
      // todo: add readonly types
      v = new ArrayType(this.buildType(typeArgs[0]))
    } else if (name === 'Int8Array') {
      v = new Int8ArrayType(this.buildType(typeArgs[0]))
    } else if (name === 'RegExp') {
      v = Type.RegExp
    } else if (name === 'Date') {
      v = Type.Date
    } else if (name === 'Error') {
      v = Type.Error
    } else if (name === 'Map') {
      v = new MapType(
        this.buildType(typeArgs[0]),
        this.buildType(typeArgs[1]),
      )
    } else if (name === 'Set') {
      v = new SetType(this.buildType(typeArgs[0]))
    } else if (
      [
        'Generator',
        'Iterator',
        'Iterable',
        'IterableIterator',
        'AsyncGenerator',
        'AsyncIterator',
        'AsyncIterableIterator',
      ].includes(name)
    ) {
      v = new GenericBuiltIn(
        name,
        typeArgs.map(t => this.buildType(t)),
      )
    } else if (name === 'Function') {
      v = Type.FunctionObject
    }
    return v
  }

  private getClassDec(tsType: ts.ObjectType | ts.InterfaceType) {
    trace('handling class decorators')
    const declarations = tsType.symbol.getDeclarations()
    if (tsType.isClass()) return declarations?.find(ts.isClassDeclaration)
    else return declarations?.find(ts.isInterfaceDeclaration)
  }

  private getCtorImport(
    tsType: ts.InterfaceType,
  ): ClassLocation | undefined {
    const symbol = tsType.symbol
    trace(`searching ctor exports of ${symbol.name}`)
    const dec = symbol.valueDeclaration ?? symbol.declarations?.[0]
    assert(dec)
    const source = dec.getSourceFile()
    const sourceSymbol = this.tc.getSymbolAtLocation(source)
    if (!sourceSymbol) return
    const exports = this.tc.getExportsOfModule(sourceSymbol)
    const opts = this.program.getCompilerOptions()
    const fileName = source.fileName
      .replace(/.ts$/, '.js')
      .replace(opts.rootDir!, opts.outDir!)

    for (let ex of exports) {
      if (ex === symbol) {
        // class is directly exported
        return {
          fileName: fileName,
          exportName: ex.name,
        }
      } else {
        const node = ex.declarations![0]
        if (ts.isExportSpecifier(node)) {
          if (node.propertyName?.text === symbol.name) {
            // class is renamed and exported
            return {
              fileName: fileName,
              exportName: ex.name,
            }
          } else if (node.name.text === symbol.name) {
            // class is exported with same name
            return {
              fileName: fileName,
              exportName: symbol.name,
            }
          }
        } else if (
          ts.isExportAssignment(node) &&
          ts.isIdentifier(node.expression) &&
          this.tc.getTypeAtLocation(node.expression) === tsType
        ) {
          // class is default exported
          return {
            fileName: fileName,
            exportName: 'default',
          }
        }
      }
    }
  }

  calculateId(
    tsType: ts.Type,
    { primitives = true, preferAlias = false }: IdOpts = {},
  ): string {
    const symbol = tsType.symbol ?? tsType.aliasSymbol
    // return this.tc.typeToString(tsType, symbol.valueDeclaration)
    if (preferAlias && tsType.aliasSymbol) {
      let genericIds = this.getGenericId(tsType.aliasTypeArguments ?? [])
      return this.getSymbolId(tsType.aliasSymbol, genericIds)
    }
    if (
      !ts.isFunctionLike(symbol?.valueDeclaration) &&
      isAnonymous(tsType)
    ) {
      trace('detected anonymous type')
      return ''
    }
    if (primitives) {
      const { flags } = tsType
      if (hasFlag(flags, TypeFlags.Any)) {
        return Type.Any.name
      } else if (hasFlag(flags, TypeFlags.Never)) {
        return Type.Never.name
      } else if (hasFlag(flags, TypeFlags.Void)) {
        return Type.Void.name
      } else if (hasFlag(flags, TypeFlags.Null)) {
        return Type.Null.name
      } else if (hasFlag(flags, TypeFlags.Undefined)) {
        return Type.Undefined.name
      } else if (hasFlag(flags, TypeFlags.Unknown)) {
        return Type.Unknown.name
      } else if (hasFlag(flags, TypeFlags.String)) {
        return Type.String.name
      } else if (hasFlag(flags, TypeFlags.Number)) {
        return Type.Number.name
      } else if (hasFlag(flags, TypeFlags.Boolean)) {
        return Type.Boolean.name
      } else if (hasFlag(flags, TypeFlags.BigInt)) {
        return Type.BigInt.name
      } else if (hasFlag(flags, TypeFlags.ESSymbol)) {
        return Type.Symbol.name
      } else if (tsType.isNumberLiteral()) {
        return '' + tsType.value
      } else if (tsType.isStringLiteral()) {
        return tsType.value
      } else if (hasFlag(flags, TypeFlags.BooleanLiteral)) {
        return (tsType as any).intrinsicName
      }
    }
    if (tsType.isUnion()) {
      return tsType.types
        .map(t => this.calculateId(t, { preferAlias: true }))
        .join(' | ')
    } else if (tsType.isUnionOrIntersection()) {
      return tsType.types
        .map(t => this.calculateId(t, { preferAlias: true }))
        .join(' & ')
    }

    // const symbol = tsType.symbol ?? tsType.aliasSymbol
    if (!symbol) {
      warn('Type does not have a symbol,', inspectTsType(tsType))
      warn(
        'top 7 props: ',
        tsType
          .getProperties()
          .slice(0, 7)
          .map(s => s.name)
          .join(', '),
      )
      return ''
    }
    if (hasFlag(tsType.flags, TypeFlags.TypeParameter)) {
      return symbol.name
    }
    const typeArguments = this.tc.getTypeArguments(
      tsType as ts.GenericType,
    )
    let genericIds = this.getGenericId(typeArguments)
    return this.getSymbolId(symbol, genericIds)
  }

  private getGenericId(typeArguments: readonly ts.Type[]) {
    let genericIds = ''
    if (typeArguments?.length) {
      genericIds =
        '<' +
        typeArguments
          .map(t =>
            this.calculateId(t, {
              primitives: true,
              preferAlias: true,
            }),
          )
          .join(', ') +
        '>'
    }
    return genericIds
  }

  private getSymbolId(symbol: ts.Symbol, genericIds?: string) {
    let parent: ts.Node | undefined = symbol.declarations?.[0].parent
    const symbolicName = symbol.name
    let acc = '__' + symbolicName + (genericIds ?? '')
    while (parent) {
      if (ts.isSourceFile(parent)) {
        acc = path.relative(this.cwd, parent.fileName) + acc
      } else {
        // todo
      }
      parent = parent.parent
    }
    return acc
  }

  private getExternalStub(
    tsType: ts.Type,
    id: string,
    typeArgs: readonly ts.Type[],
  ) {
    return new ExternalType(tsType.symbol?.name, id)
  }

  private handleEnumType(tsType: ts.UnionType) {
    const id = this.getSymbolId(tsType.aliasSymbol!)
    if (TypeStore.has(id)) return () => TypeStore.getOrThrow(id)
    const values = tsType.types.map(t =>
      t.isStringLiteral()
        ? t.value
        : t.isNumberLiteral()
        ? t.value
        : assert.fail(),
    )
    const e = new EnumType(tsType.aliasSymbol!.name, id, values)
    TypeStore.add(e)
    return () => e
  }
}
