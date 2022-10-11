import { Type } from './Type'
import { Property } from './Property'
import { Method } from './Method'
import { ConstructSignature } from './ConstructSignature'
import { CallSignature } from './CallSignature'
import { setEquals } from '../util'
import { IndexSignature } from './IndexSignature'
import { ObjectLike } from './ObjectLike'

export class ObjectType extends Type implements ObjectLike {
  /**
   * Structural Discriminant
   */
  readonly kind = 'Object' as const
  /**
   * Unique identifier for the type
   */
  readonly ref: string
  /**
   * Properties of the object
   */
  readonly properties: readonly Property[]
  /**
   * Methods of the object
   */
  readonly methods: readonly Method[]
  /**
   * Construct signatures of the object
   */
  readonly constructors: readonly ConstructSignature[]
  /**
   * Call signatures of the object
   */
  readonly callSignatures: readonly CallSignature[]
  /**
   * Index signatures of the object
   */
  readonly indexes: readonly IndexSignature[]

  constructor(
    properties: Property[],
    methods: Method[],
    name = 'Object',
    ref = '',
    constructSignatures: ConstructSignature[],
    callSignatures: CallSignature[],
    indexSignatures: IndexSignature[],
  ) {
    super(name)
    this.ref = ref
    this.properties = properties
    this.methods = methods
    this.constructors = constructSignatures
    this.callSignatures = callSignatures
    this.indexes = indexSignatures
  }

  is(other: Type): boolean {
    if (!(other instanceof ObjectType)) return false
    if (this.ref || other.ref) return this.ref === other.ref

    if (
      this.properties.length !== other.properties.length ||
      this.methods.length !== other.methods.length ||
      this.constructors.length !== other.constructors.length ||
      this.callSignatures.length !== other.callSignatures.length
    )
      return false

    if (!setEquals(this.properties, other.properties)) return false
    if (!setEquals(this.methods, other.methods)) return false
    if (!setEquals(this.constructors, other.constructors)) return false
    if (!setEquals(this.callSignatures, other.callSignatures)) return false

    return true
  }
}
