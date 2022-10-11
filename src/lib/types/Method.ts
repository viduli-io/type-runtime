import { AccessModifier, ClassMember } from './ClassMember'
import { CallSignature } from './CallSignature'
import { Decorator } from './Decorator'
import { setEquals } from '../util'

/**
 * Type information of a method of an object-like type
 */
export class Method extends ClassMember {
  /**
   * Structural discriminant
   */
  readonly kind = 'Method' as const
  /**
   * Name of the method
   */
  readonly name: string
  /**
   * Access level of the method. `private`, `protected`, or `public`
   */
  readonly access: AccessModifier
  /**
   * Call Signatures of the method.
   * A method has one signature if it has not been overloaded, and many
   * if it has been.
   */
  readonly signatures: readonly CallSignature[]
  /**
   * Decorators placed on the method.
   */
  readonly decorators: readonly Decorator[]

  constructor(
    name: string,
    access: AccessModifier,
    signatures: readonly CallSignature[],
    decorators: readonly Decorator[],
  ) {
    super()
    this.name = name
    this.access = access
    this.signatures = signatures
    this.decorators = decorators
  }

  equals(other: Method) {
    return (
      this.name === other.name &&
      this.access === other.access &&
      setEquals(this.signatures, other.signatures)
    )
  }
}
