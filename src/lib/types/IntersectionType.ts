import { Type } from './Type'
import { inspect } from 'node:util'
import { TypeRetriever } from './index'

/**
 * Contains type information about a type intersection i.e. `A & B`
 */
export class IntersectionType extends Type {
  /* @internal */ #typers: TypeRetriever[]
  /* @internal */ private _types?: Type[]

  /**
   * Structural discriminant
   */
  readonly kind = 'IntersectionType' as const
  /**
   * The types that make up the intersection
   */
  get types() {
    return (this._types ??= this.#typers.map(t => t()))
  }

  constructor(types: TypeRetriever[]) {
    super('Intersection')
    this.#typers = types
  }

  [inspect.custom]() {
    this.types
    return this
  }
}
