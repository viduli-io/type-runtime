import {
  BigIntType,
  BooleanType,
  NumberType,
  PrimitiveType,
  StringType,
} from './PrimitiveType'
import { FunctionType } from './FunctionType'
import { ClassType } from './ClassType'
import { InterfaceType } from './InterfaceType'
import { AliasType } from './AliasType'
import { IntersectionType } from './IntersectionType'
import { ObjectType } from './ObjectType'
import { UnionType } from './UnionType'
import { TupleType } from './TupleType'
import { UnsupportedType } from './UnsupportedType'
import { ArrayType } from './built-ins/arrays'
import { SetType } from './built-ins/SetType'
import { MapType } from './built-ins/MapType'
import { PromiseType } from './built-ins/PromiseType'
import { GenericBuiltIn } from './built-ins/GenericBuiltIn'
import { ESModule } from './ESModule'
import { Type } from './Type'
import { VariableDeclaration } from './declarations'
import { EnumType } from './EnumType'
import { GenericInstance } from './GenericInstance'
import { ObjectLike } from './ObjectLike'

type Maybe<T> = T | undefined | null

/**
 * Type
 */
export class TypeAssertionError extends Error {
  name = 'TypeAssertionError'
}

/**
 * Checks whether given value is a Type
 * @param value
 */
export function isType(value: unknown): value is Type {
  return value instanceof Type
}

/**
 * Asserts the given value is a Type
 * @throws TypeAssertionError
 * @param value
 */
export function assertType(value: unknown): asserts value is Type {
  if (!isType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected type')
  }
}

/**
 * Checks whether the given type is a Primitive Type -
 * string, number, boolean, bigint or symbol
 * @throws TypeAssertionError
 */
export function isPrimitiveType(
  value: Maybe<Type>,
): value is PrimitiveType {
  return value instanceof PrimitiveType
}

/**
 * Asserts the given type is a Primitive Type -
 * string, number, boolean, bigint or symbol
 * @throws TypeAssertionError
 */
export function assertPrimitiveType(
  value: Maybe<Type>,
): asserts value is Type {
  if (!isPrimitiveType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected primitive type')
  }
}

/**
 * Checks whether the given type is string
 * @param value
 */
export function isStringType(value: Maybe<Type>): value is StringType {
  return value instanceof PrimitiveType && value.name === 'string'
}

/**
 * Asserts that the given type is string
 * @param value
 */
export function assertStringType(
  value: Maybe<Type>,
): asserts value is StringType {
  if (!isStringType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected string type')
  }
}

/**
 * Checks whether the given type is number
 * @param value
 */
export function isNumberType(value: Maybe<Type>): value is NumberType {
  return value instanceof PrimitiveType && value.name === 'number'
}

/**
 * Asserts that the given type is number
 * @param value
 */
export function assertNumberType(
  value: Maybe<Type>,
): asserts value is NumberType {
  if (!isNumberType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected number type')
  }
}

/**
 * Check whether the given type is bigint
 * @param value
 */
export function isBigIntType(value: Maybe<Type>): value is BigIntType {
  return value instanceof PrimitiveType && value.name === 'bigint'
}

/**
 * Asserts that the given type is bigint
 * @param value
 */
export function assertBigIntType(
  value: Maybe<Type>,
): asserts value is BigIntType {
  if (!isBigIntType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected bigint type')
  }
}

/**
 * Checks whether the given type is boolean
 * @param value
 */
export function isBooleanType(value: Maybe<Type>): value is BooleanType {
  return value instanceof PrimitiveType && value.name === 'boolean'
}

/**
 * Asserts that the given type is boolean
 * @throws TypeAssertionError
 * @param value
 */
export function assertBooleanType(
  value: Maybe<Type>,
): asserts value is BooleanType {
  if (!isBooleanType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected boolean type')
  }
}

/**
 * Checks whether the given type is an interface
 * @param value
 */
export function isInterfaceType(
  value: Maybe<Type>,
): value is InterfaceType {
  return value instanceof InterfaceType
}

/**
 * Asserts that the given type is an interface
 * @throws TypeAssertionError
 * @param value
 */
export function assertInterfaceType(
  value: Maybe<Type>,
): asserts value is InterfaceType {
  if (!isInterfaceType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected interface')
  }
}

/**
 * Checks whether the given type is a class
 * @param value
 */
export function isClassType(value: Maybe<Type>): value is ClassType {
  return value instanceof ClassType
}

/**
 * Asserts that the given type is a class
 * @throws TypeAssertionError
 * @param value
 */
export function assertClassType(
  value: Maybe<Type>,
): asserts value is ClassType {
  if (!isClassType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected class')
  }
}

/**
 * Checks whether the given type is an object literal
 * @param value
 */
export function isObjectType(value: Maybe<Type>): value is ObjectType {
  return value instanceof ObjectType
}

/**
 * Asserts that the given type is an object literal
 * @param value
 * @throws TypeAssertionError
 */
export function assertObjectType(
  value: Maybe<Type>,
): asserts value is ObjectType {
  if (!isObjectType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected object type')
  }
}

/**
 * Checks whether the given type is object-like. i.e. has properties,
 * methods, constructors and indexes.
 * @param value
 */
export function isObjectLike(value: Maybe<Type>): value is ObjectLike {
  return (
    !!value &&
    'properties' in value &&
    'methods' in value &&
    'constructors' in value &&
    'indexes' in value
  )
}

/**
 * Asserts that the given type is object-like. i.e. can contain properties,
 * methods, constructors and indexes.
 * @param value
 * @throws TypeAssertionError
 */
export function assertObjectLike(
  value: Maybe<Type>,
): asserts value is ObjectLike {
  if (!isObjectLike(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected object like')
  }
}

/**
 * Any type that has a reference
 */
export interface ReferableType extends Type {
  ref: string
}

/**
 * Checks whether the given type has a ref
 * @param value
 */
export function isReferableType(
  value: Maybe<Type>,
): value is ReferableType {
  return !!value && 'ref' in value
}

/**
 * Asserts that the given type has a ref
 * @throws TypeAssertionError
 * @param value
 */
export function assertReferableType(
  value: Type,
): asserts value is ReferableType {
  if (!isReferableType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected referable type')
  }
}

/**
 * Checks that the given type is an alias
 * @param value
 */
export function isAliasType(value: Maybe<Type>): value is AliasType {
  return value instanceof AliasType
}

/**
 * Asserts that the given type is an alias
 * @throws TypeAssertionError
 */
export function assertAliasType(
  value: Maybe<Type>,
): asserts value is AliasType {
  if (!isAliasType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected alias')
  }
}

/**
 * Checks whether the given type is a function
 * @throws TypeAssertionError
 * @param value
 */
export function isFunctionType(value: Maybe<Type>): value is FunctionType {
  return value instanceof FunctionType
}

/**
 * Asserts that the given type is a function
 * @param value
 */
export function assertFunctionType(
  value: Maybe<Type>,
): asserts value is FunctionType {
  if (!isFunctionType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected function type')
  }
}

/**
 * Checks whether the given type is a union
 * @param value
 */
export function isUnionType(value: Maybe<Type>): value is UnionType {
  return value instanceof UnionType
}

/**
 * Asserts that the given type is a union
 * @param value
 */
export function assertUnionType(
  value: Maybe<Type>,
): asserts value is UnionType {
  if (!isUnionType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected union type')
  }
}

/**
 * Checks whether the given type is an intersection
 * @param value
 */
export function isIntersectionType(
  value: Maybe<Type>,
): value is IntersectionType {
  return value instanceof IntersectionType
}

/**
 * Asserts that the given type is an intersection
 * @param value
 */
export function assertIntersectionType(
  value: Maybe<Type>,
): asserts value is IntersectionType {
  if (!isIntersectionType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected intersection type')
  }
}

/**
 * Checks whether the given type is a tuple
 * @param value
 */
export function isTupleType(value: Maybe<Type>): value is TupleType {
  return value instanceof TupleType
}

/**
 * Asserts that the given type is a tuple
 * @param value
 */
export function assertTupleType(
  value: Maybe<Type>,
): asserts value is TupleType {
  if (!isTupleType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected tuple type')
  }
}

/**
 * Checks whether the given type is an unsupported type
 * @param value
 */
export function isUnsupportedType(
  value: Maybe<Type>,
): value is UnsupportedType {
  return value instanceof UnsupportedType
}

/**
 * Asserts that the given type is an unsupported type
 * @param value
 */
export function assertUnsupportedType(
  value: Maybe<Type>,
): asserts value is UnsupportedType {
  if (!isUnsupportedType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected unsupported type')
  }
}

/**
 * Checks whether the given type is an array
 * @param value
 */
export function isArrayType(value: Maybe<Type>): value is ArrayType {
  return value instanceof ArrayType
}

/**
 * Asserts that the given type is an array
 * @param value
 * @throws TypeAssertionError
 */
export function assertArrayType(
  value: Maybe<Type>,
): asserts value is ArrayType {
  if (!isArrayType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected array type')
  }
}

/**
 * Checks whether the given type is a set
 * @param value
 */
export function isSetType(value: Maybe<Type>): value is SetType {
  return value instanceof SetType
}

/**
 * Asserts that the given type is a set
 * @param value
 * @throws TypeAssertionError
 */
export function assertSetType(
  value: Maybe<Type>,
): asserts value is SetType {
  if (!isSetType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected set type')
  }
}

/**
 * Checks whether the given type is a map
 * @param value
 */
export function isMapType(value: Maybe<Type>): value is MapType {
  return value instanceof MapType
}

/**
 * Asserts that the given type is a map
 * @param value
 * @throws TypeAssertionError
 */
export function assertMapType(
  value: Maybe<Type>,
): asserts value is MapType {
  if (!isMapType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected map type')
  }
}

/**
 * Checks whether the given type is a promise
 * @param value
 */
export function isPromiseType(value: Maybe<Type>): value is PromiseType {
  return value instanceof PromiseType
}

/**
 * Asserts that the given type is a promise
 * @param value
 * @throws TypeAssertionError
 */
export function assertPromiseType(
  value: Maybe<Type>,
): asserts value is PromiseType {
  if (!isPromiseType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected promise type')
  }
}

/**
 * Checks whether the given type is a generic builtin
 * @param value
 */
export function isGenericBuiltIn(
  value: Maybe<Type>,
): value is GenericBuiltIn {
  return value instanceof GenericBuiltIn
}

/**
 * Asserts that the given type is a generic builtin
 * @param value
 * @throws TypeAssertionError
 */
export function assertGenericBuiltIn(
  value: Maybe<Type>,
): asserts value is GenericBuiltIn {
  if (!isGenericBuiltIn(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected generic builtin type')
  }
}

/**
 * Checks whether the given type is an ES Module
 * @param value
 */
export function isModuleType(value: Maybe<Type>): value is ESModule {
  return value instanceof ESModule
}

/**
 * Asserts that the given type is an ES Module
 * @param value
 * @throws TypeAssertionError
 */
export function assertModuleType(
  value: Maybe<Type>,
): asserts value is ESModule {
  if (!isModuleType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected es module type')
  }
}

/**
 * Checks whether the given type is an Enum
 * @param value
 */
export function isEnumType(value: Maybe<Type>): value is EnumType {
  return value instanceof EnumType
}

/**
 * Asserts that the given type is an Enum
 * @param value
 * @throws TypeAssertionError
 */
export function assertEnumType(
  value: Maybe<Type>,
): asserts value is EnumType {
  if (!isEnumType(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected enum type')
  }
}

/**
 * Checks whether the given type is a Generic Instance
 * @param value
 */
export function isGenericInstance(
  value: Maybe<Type>,
): value is GenericInstance {
  return value instanceof GenericInstance
}

/**
 * Asserts that the given type is a Generic Instance
 * @param value
 * @throws TypeAssertionError
 */
export function assertGenericInstance(
  value: Maybe<Type>,
): asserts value is GenericInstance {
  if (!isGenericInstance(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected generic instance')
  }
}

/**
 * Checks whether the given value is a variable declaration
 * @param value
 */
export function isVariableDeclaration(
  value: unknown,
): value is VariableDeclaration {
  return value instanceof VariableDeclaration
}

/**
 * Asserts the given value is a variable declaration
 * @param value
 * @throws TypeAssertionError
 */
export function assertVariableDeclaration(
  value: unknown,
): asserts value is VariableDeclaration {
  if (!isVariableDeclaration(value)) {
    console.error(value)
    throw new TypeAssertionError('Expected variable declaration')
  }
}
