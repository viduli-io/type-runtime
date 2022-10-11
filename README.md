# Type Runtime

## What is type runtime?

Type runtime is a type-aware runtime for typescript. It makes static type
information available to application code at runtime. Example,

```ts
import { typeOf, assertInterfaceType } from 'type-runtime'

interface Car {
  color: string
  price: number
  weight: number
}

const carType = typeOf<Car>()
assertInterfaceType(carType)

const propNames = carType.properties.map(p => p.name)
console.log(propNames) // prints [ 'color', 'price', 'weight' ]
```

It is possible to use this kind of reflection for dependency injection,
inversion of control, validation, json deserialization, etc.

[//]: # 'In fact, Type runtime was created to enable those features in Elevate.'

## Installation

```sh
yarn add type-runtime
```

## Usage

Type runtime is designed for server-side usage and has its own typescript
compiler command. You can use it as follows,

```sh
trt run src/main.ts
```

or you can launch it in watch mode using,

```sh
trt watch src/main.ts
```

The `typeOf` function is how you will primarily access runtime type information,

```ts
import { isUnionType, typeOf } from 'type-runtime'

const type = typeOf<string | number>()
console.log(isUnionType(type)) // prints true
```

## Supported types

### Type

All types derive from the base type `Type`. It has the following members,

- `kind: string` - structural discriminant for types. Not intended to be used directly.
- `name: string` - this is overridden by subtypes and have different meanings.
- `is(other: Type): boolean` - compare types for nominal-like equality. The comparison
  algorithm depends on the exact types being compared.

#### Static members

Static members of `Type` contain references to common types so that you can make
comparisons easily using `is`. Example, `typeOf<string>().is(Type.String)` returns
true.

- `Type.Any` - Represents the `any` type.
- `Type.Never` - Represents the `never` type.
- `Type.Void` - Represents the `void` type.
- `Type.Unknown` - Represents the `unknown` type.
- `Type.Null` - Represents the `null` type.
- `Type.Undefined` - Represents the `undefined` type.
- `Type.String` - Represents the primitive type `string`.
- `Type.Number` - Represents the primitive type `number`.
- `Type.BigInt` - Represents the primitive type `bigint`.
- `Type.Boolean` - Represents the primitive type `boolean`.
- `Type.True` - Represents the boolean literal `true`.
- `Type.False` - Represents the boolean literal `false`.
- `Type.Symbol` - Represents the primitive type `symbol`.
- `Type.UniqueSymbol`- Represents the primitive type `unique symbol`.
- `Type.Date` - Represents the built-in type `Date`.
- `Type.Error` - Represents the built-in type `Error`.
- `Type.RegExp` - Represents regular expressions, i.e. type `RegExp`
- `Type.FunctionObject` - Represents functions with type `Function`
- `Type.Unsupported` - Represents types whose information collection is not
  supported, currently that is conditional types and mapped types.

### PrimitiveType

Represents one of the 6 possible primitive types, `string`, `number`, `boolean`,
`bigint`, `symbol`, `unique symbol`

- `kind: 'Primitive'`
- `name: string` - one of the above 6 possibilities.
- `is(other: Type): boolean` - returns true is the type is exactly the primitive
  type. Returns false for literal types of the same primitive.

```ts
const type = typeOf<number>() // NumberType (PrimitiveType with name: 'number')

isPrimitiveType(type) // true
isNumberType(type) // true

type.is(Type.Number) // true
typeOf<5>().is(Type.Number) // false

assertPrimitiveType(type) // pass
assertNumberType(type) // pass
```

### StringLiteralType

Represents any string literal type. Example: `'hello'`

- `kind: 'StringLiteralType'`
- `value: string` - The value of the string literal
- `is(other: Type): boolean` - Returns true if the other type is a string literal
  with the exact same value.

```ts
const type = typeOf<'hello'>()

isStringLiteralType(type) // true
console.log(type.value) // prints hello
```

### NumberLiteralType

Represents any number literal type. Example: `5`

- `kind: 'StringLiteralType'`
- `value: string` - The value of the string literal

```ts
const type = typeOf<5>()

isNumberLiteralType(type) // true
console.log(type.value) // prints 5
```

### BooleanLiteralType

Represents the boolean literals `true` and `false`. This type is not intended
to be used directly. The literals can be accessed using `Type.True` and
`Type.False` as described above.

```ts
const type = typeOf<true>()

isBooleanLiteralType(type) // true
type.is(Type.True) // true
console.log(type.value) // prints true
```

### InterfaceType

Represents an interface.

- `kind: 'Interface'`
- `ref: string` - Unique identifier for the type. The contents are subject to
  change and should not be depended upon.
- `properties: Property[]` - Properties of the interface. Example: `foo: number`
- `methods: Method[]` - Methods of the interface. Example: `foo(x: string): string`
- `constructSignatures: ConstructSignature[]` - Construct signatures
  of the interface. Example: `new (x: string): any`
- `callSignatures: CallSignature[]` - Call signatures
  of the interface. Example: `(x: string): string`
- `indexSignatures: IndexSignature[]` - Index signatures of the interface.
  Example: `[x: string]: number`
- `typeParameters: TypeParameter[]` - Type parameters of the interface.
  Example: `interface Foo<T>`

```ts
interface Product {
  prop: string
  doSomething(): void
  new (): unknown
  (): boolean
}

const type = typeOf<Product>()
isInterfaceType(type) // true
assertInterfaceType(type) // pass
```

### ClassType

Represents a class.

- `kind: 'Class'`
- `ref: string` - Unique identifier for the type. The contents are subject to
  change and should not be depended upon.
- `properties: Property[]` - Properties of the interface. Example: `foo: number`
- `methods: Method[]` - Methods of the interface. Example: `foo(x: string): string`
- `constructSignatures: ConstructSignature[]` - Construct signatures
  of the interface. Example: `new (x: string): any`
- `indexSignatures: IndexSignature[]` - Index signatures of the interface.
  Example: `[x: string]: number`
- `typeParameters: TypeParameter[]` - Type parameters of the interface.
  Example: `interface Foo<T>`
- `decorators: Decorator[]` - Any decorators that were placed on the class.
- `static: Statics` - contains static properties and methods of the class.
- `location: ClassLocation | undefined` - contains the filename and the export name
  of the class.

```ts
class Burger {
  withCheese = false
  drop() {}
}

const type = typeOf<Burger>()
isClassType(type) // true
assertClassType(type) // pass
```

### ObjectType

Represents an object literal type.

- `kind: 'Object'`
- `ref: string` - Unique identifier for the type. The contents are subject to
  change and should not be depended upon.
- `properties: Property[]` - Properties of the object literal.
  Example: `foo: number`
- `methods: Method[]` - Methods of the object literal.
  Example: `foo(x: string): string`
- `constructSignatures: ConstructSignature[]` - Construct signatures
  of the object literal. Example: `new (x: string): any`
- `indexSignatures: IndexSignature[]` - Index signatures of the object
  literal. Example: `[x: string]: number`
- `callSignatures: CallSignature[]` - Call signatures of the object
  literal. Example: `(x: string): string`

```ts
type Sandwich = {
  ham: boolean
  make(): Sandwich
}

const type = typeOf<Sandwich>()
assertAliasType(type)
assertObjectType(type.type) // pass
```

### AliasType

Represents a type alias created using the `type` keyword.

- `kind: 'TypeAlias'`
- `ref: string` - Unique identifier for the type. The contents are subject to
  change and should not be depended upon.
- `name: string` - Name of the alias. Example, `Sandwich`
- `type: Type` - The type that this type aliases.
- `typeParameters: Type[]`
- `genericAlias: AliasType`

```ts
type Sandwich = {
  lettuce: boolean
}

const type = typeOf<Sandwich>()
assertAliasType(type)
assertObjectType(type.type) // pass
```

### EnumType

Represents an enum.

- `kind: 'EnumType'`
- `ref: string` - Unique identifier for the type. The contents are subject to
  change and should not be depended upon.
- `name: string` - Name of the alias. Example, `Sandwich`
- `values: (string | number)[]`

### FunctionType

Represents a function.

- `kind: 'FunctionType'`
- `ref: string` - Unique identifier for the type.
- `name: string` - Name of the function or 'Anonymous' for anonymous functions.
- `signatures: CallSignature[]` - Overloaded call signatures of the function.

```ts
function flipType(x: string): number
function flipType(x: number): string
function flipType(x: number | string) {
  return typeof x === 'number' ? '' + x : +x
}

type = typeOf<typeof flipType>() // FunctionType
isFunctionType(type)
assertFunctionType(type)
console.log(type.signatures.length) // 2
```

## Type Descriptors

Type descriptors describe sub-characteristics of a type. For example, `Method`
type describes the characteristics of a method in object types.

### Property

Describes a property of a class, interface, or object literal type.

- `name: string` - Name of the property.
- `type: Type` - Type of the property.
- `access: AccessModifier` - Whether the property is `public`, `private` or
  `protected`.
- `hasGetter: boolean` - Whether the property has a getter.
- `hasSetter: boolean` - Whether the property has a setter.
- `isReadOnly: boolean` - Whether the property is read-only. This is true if the
  property has only a getter or if the `readonly` keyword is used.
- `isOptional: boolean` - Whether the property is optional, i.e. `?` modifier is
  used.
- `decorators: Decorator[]` - List of decorators placed on the property.

```ts
class Test {
  get foo(): number {
    return 100
  }
}

const testType = typeOf<Test>()
assertClassType(testType)
const fooProp = testType.getProperty('foo')
console.log(fooProp)
/*
Property {
  name: 'foo',
  type: Type { number },
  access: 'public',
  hasGetter: true,
  hasSetter: false,
  isReadOnly: true,
  isOptional: false,
  decorators: []
}
 */
```

### Method

Describes a method of a class, interface, or object literal type.

- `name: string` - Name of the method.
- `access: AccessModifier` - Whether the property is `public`, `private` or
  `protected`.
- `signatures: CallSignature[]` - Call signatures of the method, includes
  overloads.
- `decorators: Decorator[]` - Decorators placed on the method.

```ts
class Test {
  foo(): number {
    return 100
  }
}

const testType = typeOf<Test>()
assertClassType(testType)
const fooMethod = testType.getMethod('foo')
console.log(fooMethod)
/*
Method {
  name: 'foo',
  type: Type { number },
  access: 'public',
  signatures: [ ... ]
  decorators: []
}
 */
```

### CallSignature

Describes the parameters and return-type of a function/method. Overloaded
functions have more than one signature.

- `parameters: Parameter[]` - the input parameters of the function/method.
- `returnType: Type` - the return type of the function/method.

```ts
function flipType(x: string): number
function flipType(x: number): string
function flipType(x: number | string) {
  return typeof x === 'number' ? '' + x : +x
}

type = typeOf<typeof flipType>() // FunctionType
isFunctionType(type)
assertFunctionType(type)
console.log(type.signatures)
/*
[
  CallSignature {
    parameters: [ { name: x, type: string } ]
    returnType: Type { number }
  },
  CallSignature {
    parameters: [ { name: x, type: number } ]
    returnType: Type { string }
  },
]
 */
```

### ConstructSignature

Describes the signature of a class, interface, or object literal constructor,
i.e. it's parameters.

- `parameters: Parameter[]` - the input parameters of the constructor.

```ts
class Test {
  constructor(a: string, b: number) {}
}

const testType = typeOf<Test>()
assertClassType(testType)

console.log(testType.constructors)
/*
[
  ConstructSignature {
    parameters: [ { name: x, type: string } ]
  }
] 
*/
```

### Decorator

Describes a decorator that is placed on a class, property, method or parameter.

- `type: FunctionType` - The type of the decorator function

```ts
function foo(...args: any[]) {}
function bar() {
  return function (...args: any[]) {}
}

@foo
@bar()
class Test {}

const fooType = typeOf<typeof foo>()
assertFunctionType(fooType)
const barType = typeOf<typeof bar>()
assertFunctionType(barType)

const testType = typeOf<Test>()
assertClassType(testType)

testType.hasDecorator(fooType) // true
testType.hasDecorator(barType) // true
```
