import { Type } from './Type'
import { inspect } from 'node:util'
import { TypeRetriever } from './index'

export class TypeParameter extends Type {
  /* @internal */ #constraint?: TypeRetriever
  /* @internal */ #default?: TypeRetriever
  /* @internal */ private _constraint?: Type
  /* @internal */ private _default?: Type

  /**
   * Structural discriminant
   */
  readonly kind = 'TypeParameter' as const

  /**
   * Constraint of the type.
   * This is the type that is denoted by the `extends` keyword when
   * declaring a type parameter.
   */
  get constraint() {
    return (this._constraint ??= this.#constraint?.())
  }

  /**
   * Default type of the parameter
   */
  get default() {
    return (this._default ??= this.#default?.())
  }

  constructor(
    name: string,
    constraint: TypeRetriever | undefined,
    defaultType: TypeRetriever | undefined,
  ) {
    super(name)
    this.#constraint = constraint
    this.#default = defaultType
  }

  /* @internal */
  [inspect.custom]() {
    this.constraint
    this.default
    return this
  }
}
