import { Type } from './Type'

/**
 * Represents a type whose type information was not collected.
 */
export class UnsupportedType extends Type {
  readonly kind = 'UnsupportedType' as const
}

Type.Unsupported = new UnsupportedType('Unsupported')
