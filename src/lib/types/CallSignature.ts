import { Parameter } from './Parameter'
import { Type } from './Type'
import { inspect } from 'node:util'
import { FunctionType, TypeRetriever } from './index'

/**
 * Represents the call signature of a method or function. An overloaded
 * function has more than one call signature.
 */
export class CallSignature {
  #retType: TypeRetriever
  private _returnType?: Type

  /**
   * Parameters accepted by the method/function.
   */
  readonly parameters: readonly Parameter[]

  /**
   * Type of the value returned by the method/function.
   */
  get returnType() {
    return (this._returnType ??= this.#retType())
  }

  constructor(parameters: Parameter[], retType: TypeRetriever) {
    this.parameters = parameters
    this.#retType = retType
  }

  equals(other: CallSignature) {
    if (!this.returnType.is(other.returnType)) return false
    if (this.parameters.length !== other.parameters.length) return false

    for (let i = 0; i < this.parameters.length; i++) {
      const a = this.parameters[i]
      const b = other.parameters[i]
      if (!a.equals(b)) return false
    }
    return true
  }

  [inspect.custom]() {
    this.returnType
    return this
  }
}
