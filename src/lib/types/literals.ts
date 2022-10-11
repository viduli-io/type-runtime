import { Type } from './Type'
import { inspect } from 'node:util'

/**
 * Indicates a number literal type and contains its value.
 */
export class NumberLiteralType extends Type {
  /**
   * Structural discriminant
   */
  readonly kind = 'NumberLiteral' as const
  /**
   *
   */
  readonly value: number

  constructor(value: number) {
    super('NumberLiteral')
    this.value = value
  }

  [inspect.custom]() {
    return `Literal { ${this.value} }`
  }
}

/**
 * Indicates a string literal type and contains its value.
 */
export class StringLiteralType extends Type {
  /**
   * Structural discriminant
   */
  readonly kind = 'StringLiteral' as const
  /**
   *
   */
  readonly value: string

  constructor(value: string) {
    super('StringLiteral')
    this.value = value
  }

  [inspect.custom]() {
    return `Literal { '${this.value}' }`
  }
}

/**
 * Indicates a boolean literal type and contains its value.
 * This is not meant to be constructed directly.
 * Literals `true` and `false` can be accessed through `Type.True`
 */
export class BooleanLiteralType extends Type {
  /**
   * Structural discriminant
   */
  readonly kind = 'BooleanLiteral' as const
  /**
   *
   */
  readonly value: boolean

  constructor(value: boolean) {
    super('BooleanLiteral')
    this.value = value
  }

  [inspect.custom]() {
    return `Literal { ${this.value} }`
  }
}

Type.True = new BooleanLiteralType(true)
Type.False = new BooleanLiteralType(false)
