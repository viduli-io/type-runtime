import { Type } from './Type'
import { Property } from './Property'
import { Method } from './Method'
import { CallSignature } from './CallSignature'
import { IndexSignature } from './IndexSignature'
import { ConstructSignature } from './ConstructSignature'

/**
 * An object-like type could be a class, interface, or an object literal
 */
export interface ObjectLike extends Type {
  /**
   * Properties of the object
   */
  properties: readonly Property[]
  /**
   * Methods of the object
   */
  methods: readonly Method[]
  /**
   * Call Signatures, if any.
   * Class types do not contain this property.
   */
  callSignatures?: readonly CallSignature[]
  /**
   * Constructors of the object
   */
  constructors: readonly ConstructSignature[]
  /**
   * Indexes of the object
   */
  indexes: readonly IndexSignature[]
}
