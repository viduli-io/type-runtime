import { Decorator } from './Decorator'
import { FunctionType } from './FunctionType'

export enum AccessModifier {
  Public = 'public',
  Protected = 'protected',
  Private = 'private',
}

export abstract class ClassMember {
  /**
   * List of decorators that are placed on this member.
   */
  readonly decorators!: readonly Decorator[]

  /**
   * Check whether this member is decorated with the given decorator function.
   * @param decorFn The type of the decorator function
   * @example
   * class
   */
  hasDecorator(decorFn: FunctionType): boolean {
    return this.decorators.some(t => t.type.is(decorFn))
  }
}
