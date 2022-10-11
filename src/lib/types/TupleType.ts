import { Type } from './Type'
import { inspect } from 'node:util'
import type { TypeRetriever } from './index'

/**
 * Type information pertaining to tuples
 */
export class TupleType extends Type {
  /* @internal */ #typers: TypeRetriever[]
  /* @internal */ private _types?: Type[]

  /**
   * Structural discriminant
   */
  readonly kind = 'TupleType' as const

  /**
   * The types of the tuple elements
   */
  get types() {
    return (this._types ??= this.#typers.map(t => t()))
  }

  constructor(types: TypeRetriever[]) {
    super('TupleType')
    this.#typers = types
  }

  /* @internal */
  [inspect.custom]() {
    this.types
    return this
  }
}
