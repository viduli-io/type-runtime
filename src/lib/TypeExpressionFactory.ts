import ts from 'typescript'
import {
  BooleanLiteralType,
  NumberLiteralType,
  StringLiteralType,
  ArrayType,
  BuiltInType,
  GenericBuiltIn,
  MapType,
  PromiseType,
  SetType,
  Type,
  ClassType,
  InterfaceType,
  AliasType,
  ObjectType,
  GenericInstance,
  UnionType,
  IntersectionType,
  TypeParameter,
  FunctionType,
  TupleType,
  Decorator,
  Property,
  Method,
  Parameter,
  ConstructSignature,
  CallSignature,
  ExternalType,
  ESModule,
  EnumType,
  IndexSignature,
} from './types'
import { isReferableType } from './types/guards'

const _ = undefined
const tsf = ts.factory
const stringLit = tsf.createStringLiteral
const numLit = tsf.createNumericLiteral
const arrayLit = tsf.createArrayLiteralExpression
const propAccess = tsf.createPropertyAccessExpression
const createNew = tsf.createNewExpression
const voidExpr = () =>
  tsf.createVoidExpression(tsf.createNumericLiteral(0))

function boolLit(value: boolean) {
  return value ? tsf.createTrue() : tsf.createFalse()
}

/**
 * Code generation for `Type` and its subclasses
 */
export class TypeExpressionFactory {
  typeLib = ts.factory.createIdentifier('__trt')

  accessTypeLib(name: string) {
    return propAccess(this.typeLib, name)
  }

  makeLibImport() {
    return tsf.createImportDeclaration(
      _,
      tsf.createImportClause(false, this.typeLib, _),
      tsf.createStringLiteral('type-runtime'),
    )
  }

  makeTypeExpression(type: Type): ts.Expression {
    const keys: (keyof typeof Type)[] = [
      'Any',
      'Void',
      'Unknown',
      'Never',
      'Null',
      'Undefined',
      'String',
      'Number',
      'Boolean',
      'BigInt',
      'Unsupported',
      'Symbol',
      'UniqueSymbol',
      'Error',
      'Date',
      'Error',
      'RegExp',
      'FunctionObject',
    ]
    let t = ''
    for (let key of keys) if (type === Type[key]) t = key
    if (t) return propAccess(propAccess(this.typeLib, 'Type'), t)

    if (type instanceof ClassType) {
      return this.makeClass(type)
    } else if (type instanceof InterfaceType) {
      return this.makeInterface(type)
    } else if (type instanceof ObjectType) {
      return this.makeObject(type)
    } else if (type instanceof GenericInstance) {
      return this.makeGenericInstance(type)
    } else if (type instanceof AliasType) {
      return this.makeAliasType(type)
    } else if (type instanceof UnionType) {
      return this.makeUnionOrInt(type)
    } else if (type instanceof IntersectionType) {
      return this.makeUnionOrInt(type)
    } else if (type instanceof NumberLiteralType) {
      return this.makeNumLiteral(type)
    } else if (type instanceof StringLiteralType) {
      return this.makeStringLiteral(type)
    } else if (type instanceof BooleanLiteralType) {
      return this.makeBooleanLiteral(type)
    } else if (type instanceof TypeParameter) {
      return this.makeTypeParameter(type)
    } else if (type instanceof FunctionType) {
      return this.makeFunctionType(type)
    } else if (type instanceof TupleType) {
      return this.makeUnionOrInt(type)
    } else if (type instanceof EnumType) {
      return this.makeEnum(type)
    } else if (type instanceof TypeParameter) {
      return this.makeTypeParameter(type)
    }
    // Built-ins
    // if (type instanceof BuiltInType) {
    //   type.
    // }
    if (type instanceof ArrayType) {
      return this.makeArrayType(type)
    } else if (type instanceof MapType) {
      return this.makeMapType(type)
    } else if (type instanceof SetType) {
      return this.makeSetType(type)
    } else if (type instanceof PromiseType) {
      return this.makePromiseType(type)
    } else if (type instanceof GenericBuiltIn) {
      return this.makeGenericBuiltIn(type)
    } else if (type instanceof ExternalType) {
      return this.makeExternalType(type)
    } else if (type instanceof ESModule) {
      return this.makeESModule(type)
    }
    console.log(type)
    throw new Error('not implemented')
  }

  makeArrayType(type: ArrayType) {
    return createNew(
      this.accessTypeLib(ArrayType.name),
      [],
      [this.makeTypeRetriever(type.elementType)],
    )
  }

  makeClass(type: ClassType) {
    return createNew(this.accessTypeLib(ClassType.name), _, [
      stringLit(type.ref),
      stringLit(type.name),
      arrayLit(type.properties.map(t => this.makeProperty(t))),
      arrayLit(type.methods.map(t => this.makeMethod(t))),
      this.voidOrRetrieve(type.superType),
      arrayLit(type.implementsTypes.map(t => this.makeTypeRetriever(t))),
      arrayLit(type.typeParameters.map(t => this.makeTypeParameter(t))),
      this.makeLocation(type),
      arrayLit(type.constructors.map(t => this.makeCtorSig(t))),
      arrayLit(type.decorators.map(d => this.makeDecorator(d))),
      tsf.createObjectLiteralExpression([]),
      arrayLit(type.indexes.map(i => this.makeIndexSig(i))),
    ])
  }

  makeLocation(type: ClassType) {
    return type.location
      ? tsf.createObjectLiteralExpression([
          tsf.createPropertyAssignment(
            'fileName',
            tsf.createStringLiteral(type.location.fileName),
          ),
          tsf.createPropertyAssignment(
            'exportName',
            tsf.createStringLiteral(type.location.exportName),
          ),
        ])
      : voidExpr()
  }

  makeDecorator(d: Decorator) {
    return createNew(this.accessTypeLib(Decorator.name), _, [
      this.makeTypeRetriever(d.type),
    ])
  }

  makeInterface(type: InterfaceType) {
    return createNew(this.accessTypeLib(InterfaceType.name), _, [
      stringLit(type.ref),
      stringLit(type.name),
      arrayLit(type.properties.map(t => this.makeProperty(t))),
      arrayLit(type.methods.map(t => this.makeMethod(t))),
      arrayLit(type.extendsTypes.map(t => this.makeTypeRetriever(t))),
      arrayLit(type.constructors.map(t => this.makeCtorSig(t))),
      arrayLit(type.callSignatures.map(t => this.makeCallSig(t))),
      arrayLit(type.typeParameters.map(t => this.makeTypeParameter(t))),
      arrayLit(type.indexes.map(i => this.makeIndexSig(i))),
    ])
  }

  makeObject(type: ObjectType) {
    return createNew(this.accessTypeLib(ObjectType.name), _, [
      arrayLit(type.properties.map(t => this.makeProperty(t))),
      arrayLit(type.methods.map(t => this.makeMethod(t))),
      stringLit(type.name),
      stringLit(type.ref),
      arrayLit(type.constructors.map(t => this.makeCtorSig(t))),
      arrayLit(type.callSignatures.map(t => this.makeCallSig(t))),
      arrayLit(type.indexes.map(i => this.makeIndexSig(i))),
    ])
  }

  makeGenericInstance(type: GenericInstance) {
    return createNew(this.accessTypeLib(GenericInstance.name), _, [
      arrayLit(type.properties.map(t => this.makeProperty(t))),
      arrayLit(type.methods.map(t => this.makeMethod(t))),
      this.makeTypeRetriever(type.genericType),
      arrayLit(type.typeArguments.map(t => this.makeTypeRetriever(t))),
      stringLit(type.name),
      stringLit(type.ref),
    ])
  }

  makeTypeParameter(type: TypeParameter): ts.Expression {
    return createNew(this.accessTypeLib(TypeParameter.name), _, [
      stringLit(type.name),
      this.voidOrRetrieve(type.constraint),
      this.voidOrRetrieve(type.default),
    ])
  }

  makeProperty(prop: Property) {
    return createNew(this.accessTypeLib(Property.name), _, [
      stringLit(prop.name),
      this.makeTypeRetriever(prop.type),
      stringLit(prop.access),
      boolLit(prop.hasGetter),
      boolLit(prop.hasSetter),
      boolLit(prop.isReadOnly),
      boolLit(prop.isOptional),
      arrayLit(prop.decorators.map(d => this.makeDecorator(d))),
    ])
  }

  makeMethod(type: Method) {
    return createNew(this.accessTypeLib(Method.name), _, [
      stringLit(type.name),
      stringLit(type.access),
      arrayLit(type.signatures.map(s => this.makeCallSig(s))),
      arrayLit(type.decorators.map(d => this.makeDecorator(d))),
    ])
  }

  makeCallSig(type: CallSignature) {
    return createNew(this.accessTypeLib(CallSignature.name), _, [
      arrayLit(type.parameters.map(t => this.makeParameter(t))),
      this.makeTypeRetriever(type.returnType),
    ])
  }

  makeGetFromStoreOrInline(type: Type) {
    if (isReferableType(type) && type.ref) {
      return tsf.createCallExpression(
        propAccess(this.accessTypeLib('TypeStore'), 'getOrThrow'),
        _,
        [stringLit(type.ref)],
      )
    }
    return this.makeTypeExpression(type)
  }

  makeTypeRetriever(type: Type) {
    return tsf.createArrowFunction(
      _,
      _,
      [],
      _,
      _,
      this.makeGetFromStoreOrInline(type),
    )
  }

  makeTypeStoreLoad(results: ts.Expression[]) {
    return ts.factory.createExpressionStatement(
      tsf.createCallExpression(
        propAccess(this.accessTypeLib('TypeStore'), 'load'),
        _,
        results,
      ),
    )
  }

  makeNumLiteral(type: NumberLiteralType) {
    return createNew(this.accessTypeLib(NumberLiteralType.name), _, [
      numLit(type.value),
    ])
  }

  makeStringLiteral(type: StringLiteralType) {
    return createNew(this.accessTypeLib(StringLiteralType.name), _, [
      stringLit(type.value),
    ])
  }

  makeBooleanLiteral(type: BooleanLiteralType) {
    return createNew(this.accessTypeLib(BooleanLiteralType.name), _, [
      boolLit(type.value),
    ])
  }

  makeUnionOrInt(type: UnionType | IntersectionType | TupleType) {
    return createNew(this.accessTypeLib(type.constructor.name), _, [
      arrayLit(type.types.map(t => this.makeTypeRetriever(t))),
    ])
  }

  makeAliasType(type: AliasType) {
    return createNew(this.accessTypeLib(AliasType.name), _, [
      stringLit(type.ref),
      stringLit(type.name),
      this.makeTypeRetriever(type.type),
      arrayLit(type.typeParameters.map(t => this.makeTypeRetriever(t))),
      this.voidOrRetrieve(type.genericAlias),
    ])
  }

  makeFunctionType(type: FunctionType) {
    return createNew(this.accessTypeLib(FunctionType.name), _, [
      arrayLit(type.signatures.map(t => this.makeCallSig(t))),
      stringLit(type.name),
      stringLit(type.ref),
    ])
  }

  makeParameter(p: Parameter) {
    return createNew(this.accessTypeLib(Parameter.name), _, [
      stringLit(p.name),
      this.makeTypeRetriever(p.type),
      boolLit(p.optional),
    ])
  }

  private voidOrRetrieve(t: Type | undefined) {
    return t ? this.makeTypeRetriever(t) : tsf.createVoidZero()
  }

  makeMapType(type: MapType) {
    return createNew(this.accessTypeLib(MapType.name), _, [
      this.makeTypeRetriever(type.key),
      this.makeTypeRetriever(type.value),
    ])
  }

  makePromiseType(type: PromiseType) {
    return createNew(this.accessTypeLib(PromiseType.name), _, [
      this.makeTypeRetriever(type.resolvesType),
    ])
  }

  makeGenericBuiltIn(type: GenericBuiltIn) {
    return createNew(this.accessTypeLib(GenericBuiltIn.name), _, [
      stringLit(type.name),
      arrayLit(type.typeArguments.map(t => this.makeTypeRetriever(t))),
    ])
  }

  makeSetType(type: SetType) {
    return createNew(this.accessTypeLib(SetType.name), _, [
      this.makeTypeRetriever(type.value),
    ])
  }

  makeCtorSig(type: ConstructSignature) {
    return createNew(this.accessTypeLib(ConstructSignature.name), _, [
      arrayLit(type.parameters.map(t => this.makeParameter(t))),
      this.makeTypeRetriever(type.returnType),
    ])
  }

  makeExternalType(type: ExternalType) {
    return createNew(this.accessTypeLib(ExternalType.name), _, [
      stringLit(type.name),
      stringLit(type.ref),
    ])
  }

  makeESModule(type: ESModule) {
    return createNew(this.accessTypeLib(ESModule.name), _, [
      stringLit(type.ref),
      stringLit(type.fileName),
    ])
  }

  makeEnum(type: EnumType) {
    return createNew(this.accessTypeLib(EnumType.name), _, [
      stringLit(type.name),
      stringLit(type.ref),
      arrayLit(
        type.values.map(v =>
          typeof v === 'string' ? stringLit(v) : numLit(v),
        ),
      ),
    ])
  }

  makeIndexSig(sig: IndexSignature) {
    return createNew(this.accessTypeLib(IndexSignature.name), _, [
      this.makeTypeRetriever(sig.key),
      this.makeTypeRetriever(sig.value),
    ])
  }
}
