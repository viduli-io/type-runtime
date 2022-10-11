import { inspect } from 'util'
import { Decorator, FunctionType, TypeRetriever } from './index'
import { Type } from '../types/Type'

/**
 * Type information of a method or constructor parameter
 */
export class Parameter {
  /* @internal */ #typer: TypeRetriever
  /* @internal */ private _type?: Type

  /**
   * Name of the parameter
   */
  readonly name: string
  /**
   * Whether passing a value to the parameter is optional
   */
  readonly optional: boolean
  /**
   * Decorators placed on the parameter
   */
  readonly decorators: readonly Decorator[]

  /**
   * Type of the parameter
   */
  get type() {
    return (this._type ??= this.#typer())
  }

  constructor(
    name: string,
    typer: TypeRetriever,
    optional: boolean,
    decor: Decorator[],
  ) {
    this.#typer = typer
    this.name = name
    this.optional = optional
    this.decorators = decor
  }

  /**
   * Check whether the parameter is decorated using the given function
   * @param decorFn
   */
  hasDecorator(decorFn: FunctionType) {
    return this.decorators.some(t => t.type.is(decorFn))
  }

  equals(other: Parameter) {
    return this.optional === other.optional && this.type.is(other.type)
  }

  [inspect.custom]() {
    this.type
    return this
  }
}
