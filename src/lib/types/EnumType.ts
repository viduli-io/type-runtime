import { Type } from './Type'

/**
 * Represents a TypeScript enum.
 */
export class EnumType extends Type {
  /**
   * Structural discriminant
   */
  readonly kind = 'EnumType' as const
  /**
   * Unique identifier for the type
   */
  readonly ref: string
  /**
   * Values of the enum
   */
  readonly values: (string | number)[]

  constructor(name: string, ref: string, values: (string | number)[]) {
    super(name)
    this.ref = ref
    this.values = values
  }
}
