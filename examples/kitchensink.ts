import {
  typeOf,
  Type,
  assertNumberType,
  assertStringType,
  isPrimitiveType,
  isBigIntType,
  isNumberType,
  isStringType,
  isBooleanType,
  assertPrimitiveType,
  assertBooleanType,
  assertBigIntType,
  isUnionType,
  assertUnionType,
  isIntersectionType,
  assertIntersectionType,
  isClassType,
  assertClassType,
  isInterfaceType,
  assertInterfaceType,
  isAliasType,
  assertAliasType,
  isObjectType,
  assertObjectType,
  isFunctionType,
  assertFunctionType,
} from 'type-runtime'

let type: Type

type = typeOf<number>() // NumberType
isPrimitiveType(type) // true
assertPrimitiveType(type)
isNumberType(type) // true
assertNumberType(type)

type = typeOf<string>() // StringType
isPrimitiveType(type) // true
isStringType(type) // true
assertStringType(type)

type = typeOf<boolean>() // BooleanType
isPrimitiveType(type) // true
isBooleanType(type) // true
assertBooleanType(type)

type = typeOf<bigint>() // BigIntType
isPrimitiveType(type) // true
isBigIntType(type) // true
assertBigIntType(type)

type = typeOf<string | number>() // UnionType
isUnionType(type)
assertUnionType(type)
console.log(type.types) // [ StringType, NumberType ]

type = typeOf<{ a: string } & { b: number }>() // IntersectionType
isIntersectionType(type)
assertIntersectionType(type)
console.log(type.types) // [ ObjectType, ObjectType ]

class Person {
  id = 0
  firstName = ''
  lastName = ''
}

type = typeOf(Person) // or typeOf<Person>() - ClassType
isClassType(type) // true
assertClassType(type)

interface Building {
  nFloors: number
  nExits: number
  demolish(): void
}

type = typeOf<Building>() // InterfaceType
isInterfaceType(type) // true
assertInterfaceType(type)

type Fido = {
  bono: number
  dito: string
}

type = typeOf<Fido>() // AliasType
isAliasType(type) // true
assertAliasType(type)

const objectType = type.type // ObjectType
isObjectType(objectType) // true
assertObjectType(objectType)

function flipType(x: string): number
function flipType(x: number): string
function flipType(x: number | string) {
  return typeof x === 'number' ? '' + x : +x
}

type = typeOf<typeof flipType>() // FunctionType
isFunctionType(type)
assertFunctionType(type)
console.log(type.signatures.length) // 2
