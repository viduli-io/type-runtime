import { BuiltInType } from './built-ins/BuiltInType'
import { inspect } from 'util'
import { PrimitiveType } from './PrimitiveType'
import { UnsupportedType } from './UnsupportedType'
import { BooleanLiteralType } from './literals'

export class Type {
  /**
   * Represents the type `any`
   */
  static readonly Any = new Type('any')
  /**
   * Represents the type `never`
   */
  static readonly Never = new Type('never')
  /**
   * Represents the type `void`
   */
  static readonly Void = new Type('void')
  /**
   * Represents the type `unknown`
   */
  static readonly Unknown = new Type('unknown')
  /**
   * Represents the type `null`
   */
  static readonly Null = new Type('null')
  /**
   * Represents the type `undefined`
   */
  static readonly Undefined = new Type('undefined')
  /**
   * Represents the type `string`
   */
  static String: PrimitiveType
  /**
   * Represents the type `number`
   */
  static Number: PrimitiveType
  /**
   * Represents the type `boolean`
   */
  static Boolean: PrimitiveType
  /**
   * Represents the type `bigint`
   */
  static BigInt: PrimitiveType
  /**
   * Represents the type `symbol`
   */
  static Symbol: PrimitiveType
  /**
   * Represents the type `unique symbol`
   */
  static UniqueSymbol: PrimitiveType
  /**
   * Represents the built-in `Date` type
   */
  static Date: BuiltInType
  /**
   * Represents the built-in `Error` type
   */
  static Error: BuiltInType
  /**
   * Represents the built-in `RegExp` type
   */
  static RegExp: BuiltInType
  /**
   * Represents the built-in `True` type
   */
  static True: BooleanLiteralType
  /**
   * Represents the built-in `False` type
   */
  static False: BooleanLiteralType
  /**
   * Represents the built-in `Unsupported` type
   */
  static Unsupported: UnsupportedType

  /**
   * Any value of type `Function`, usually when a function is created using
   * `new Function(...)`
   */
  static FunctionObject: BuiltInType

  /**
   * Structural discriminant
   */
  readonly kind: string = 'Type'
  /**
   * Name of the type
   */
  name: string = '';

  /* internal */
  [inspect.custom]?(): any

  constructor(name: string) {
    this.name = name
  }

  /**
   * Check for nominal-like equality of types.
   * @param type
   */
  is(type: Type): boolean {
    if (this === type) return true

    return false
  }
}

Type.Any[inspect.custom] = () => 'Type { any }'
Type.Void[inspect.custom] = () => 'Type { void }'
Type.Never[inspect.custom] = () => 'Type { never }'
Type.Unknown[inspect.custom] = () => 'Type { unknown }'
Type.Null[inspect.custom] = () => 'Type { null }'
Type.Undefined[inspect.custom] = () => 'Type { undefined }'
