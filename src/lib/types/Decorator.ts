import { inspect } from 'node:util'
import { FunctionType } from './index'

/**
 * Describes decorators placed on a class or its members.
 */
export class Decorator {
  #typer: () => FunctionType
  private _type?: FunctionType

  /**
   * The type of the function used as the decorator.
   */
  get type() {
    return (this._type ??= this.#typer())
  }

  constructor(type: () => FunctionType) {
    this.#typer = type
  }

  [inspect.custom]() {
    this.type
    return this
  }
}
