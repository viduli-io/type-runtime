import { Type } from './Type'
import { inspect } from 'node:util'
import type { TypeRetriever } from './index'

/**
 * Type information pertaining to a union. i.e. `A | B`
 */
export class UnionType extends Type {
  /* @internal */ #typers: TypeRetriever[]
  /* @internal */ private _types?: Type[]

  /**
   * Structural discriminant
   */
  readonly kind = 'UnionType' as const

  /**
   * The types contained within the union
   */
  get types() {
    if (this._types) return this._types
    // true and false in the union is reduced to boolean
    let types = this.#typers.map(t => t())
    const maybeBools = types.filter(
      t => t === Type.True || t === Type.False,
    )
    if (
      maybeBools.includes(Type.True) &&
      maybeBools.includes(Type.False)
    ) {
      types = [
        ...types.filter(t => t !== Type.True && t !== Type.False),
        Type.Boolean,
      ]
    }
    return (this._types ??= types)
  }

  constructor(types: TypeRetriever[]) {
    super('Union')
    this.#typers = types
  }

  /**
   * Checks whether the union contains the given type.
   * @param type
   */
  has(type: Type): boolean {
    if (this.types.some(t => t.is(type))) return true

    // True is contained if true
    if (type.is(Type.True) && this.types.some(t => t === Type.Boolean)) {
      return true
    } else if (
      type.is(Type.False) &&
      this.types.some(t => t === Type.Boolean)
    )
      return true

    return false
  }

  /* @internal */
  [inspect.custom]() {
    this.types
    return this
  }
}
