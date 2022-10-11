import { inspect } from 'util'
import { Type } from './Type'
import { CallSignature } from './CallSignature'
import { isFunctionType } from './guards'

/**
 * Represents the type of a lambda or traditional function
 */
export class FunctionType extends Type {
  /**
   * Structural discriminant
   */
  readonly kind = 'FunctionType' as const
  /**
   * Unique identifier of the type
   */
  readonly ref: string
  /**
   * Call signatures of the function.
   * Overloaded functions have multiple signatures, non-overloaded
   * functions have one.
   */
  readonly signatures: CallSignature[]

  constructor(signatures: CallSignature[], name = 'Anonymous', ref = '') {
    super(name)
    this.ref = ref
    this.signatures = signatures
  }

  /**
   * Check for exact equality of the function.
   * Returns true only if the other type is a function type and has a non-empty
   * ref that is equal to this ref.
   * @param other
   */
  is(other: Type): boolean {
    return isFunctionType(other) && !!this.ref && this.ref === other.ref
  }

  [inspect.custom]() {
    return this
  }
}
