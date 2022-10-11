import { AccessModifier, ClassMember } from './ClassMember'
import { inspect } from 'util'
import { Decorator, TypeRetriever } from './index'
import { Type } from './Type'

/**
 * Type information about a property
 */
export class Property extends ClassMember {
  /* @internal */ #typer: TypeRetriever
  /* @internal */ private _type?: Type

  /**
   * Structural discriminant
   */
  readonly kind = 'Property' as const
  /**
   * Name of the property
   */
  readonly name: string
  /**
   * Access level of the property
   */
  readonly access: AccessModifier
  /**
   * Whether this property has a getter.
   */
  readonly hasGetter: boolean
  /**
   * Whether this property has a setter.
   */
  readonly hasSetter: boolean
  /**
   * Whether this property is read-only.
   * A property is considered read only if it's declared using the
   * `readonly` keyword, or has a getter but not a setter.
   */
  readonly isReadOnly: boolean
  /**
   * Whether this property is optional.
   * Properties are considered optional when the question token is used.
   */
  readonly isOptional: boolean
  /**
   * Decorators placed on this property.
   */
  readonly decorators: readonly Decorator[]
  /**
   * Type of the property
   */
  get type() {
    return (this._type ??= this.#typer())
  }

  constructor(
    name: string,
    typer: TypeRetriever,
    access: AccessModifier,
    hasGetter: boolean,
    hasSetter: boolean,
    isReadOnly: boolean,
    isOptional: boolean,
    decorators: readonly Decorator[],
  ) {
    super()
    this.#typer = typer
    this.name = name
    this.access = access
    this.hasGetter = hasGetter
    this.hasSetter = hasSetter
    this.isReadOnly = isReadOnly
    this.isOptional = isOptional
    this.decorators = decorators
  }

  /* @internal */
  equals(other: Property) {
    if (this === other) return true
    return (
      this.name === other.name &&
      this.access === other.access &&
      this.hasGetter === other.hasGetter &&
      this.hasSetter === other.hasSetter &&
      this.isReadOnly === other.isReadOnly &&
      this.isOptional === other.isOptional &&
      this.type.is(other.type)
    )
  }

  /* @internal */
  [inspect.custom]() {
    this.type
    return this
  }
}
