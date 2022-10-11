import { Type } from './Type'
import { inspect } from 'node:util'
import { TypeParameter, TypeRetriever } from './index'

/**
 * Represents a type alias created using the `type` keyword.
 *
 * @example
 * type SpecialString = string
 */
export class AliasType extends Type {
  #typer: TypeRetriever
  #typeParamser: (() => Type)[]
  #genericAlias?: TypeRetriever
  private _type?: Type
  private _typeParameters?: Type[]
  private _genericAlias?: Type

  readonly kind = 'TypeAlias' as const
  readonly ref: string

  /**
   * The type represented by the alias.
   */
  get type() {
    try {
      return (this._type ??= this.#typer())
    } catch (e) {
      console.error('Error in ' + this.ref)
      throw e
    }
  }

  /**
   * Type parameters of the alias.
   */
  get typeParameters() {
    return (this._typeParameters ??= this.#typeParamser.map(t => t()))
  }

  get genericAlias() {
    return (this._genericAlias ??= this.#genericAlias?.()) as
      | AliasType
      | undefined
  }

  constructor(
    ref: string,
    name: string,
    type: TypeRetriever,
    typeParams: (() => TypeParameter)[],
    genericAlias: TypeRetriever | undefined,
  ) {
    super(name)
    this.ref = ref
    this.#typer = type
    this.#typeParamser = typeParams
    this.#genericAlias = genericAlias
  }

  [inspect.custom]() {
    this.type
    this.typeParameters
    this.genericAlias
    return this
  }
}
