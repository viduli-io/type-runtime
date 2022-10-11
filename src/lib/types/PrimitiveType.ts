import { Type } from './Type'
import { inspect } from 'util'

/**
 * Represents primitive types
 */
export class PrimitiveType extends Type {
  /**
   * Structural discriminant
   */
  kind = 'Primitive' as const;

  /* @internal */
  [inspect.custom]() {
    return `${this.name}`
  }
}

export interface StringType extends PrimitiveType {
  name: 'string'
}

export interface NumberType extends PrimitiveType {
  name: 'number'
}

export interface BooleanType extends PrimitiveType {
  name: 'boolean'
}

export interface BigIntType extends PrimitiveType {
  name: 'bigint'
}

Type.String = new PrimitiveType('string')
Type.Number = new PrimitiveType('number')
Type.Boolean = new PrimitiveType('boolean')
Type.BigInt = new PrimitiveType('bigint')
Type.Symbol = new PrimitiveType('symbol')
Type.UniqueSymbol = new PrimitiveType('unique symbol')
