import { Type } from './Type'
import { Declaration } from './declarations'
import { AliasType } from './AliasType'
import { InterfaceType } from './InterfaceType'
import { ClassType } from './ClassType'
import { FunctionType } from './FunctionType'

export type ModuleContent =
  | AliasType
  | InterfaceType
  | ClassType
  | FunctionType
  | Declaration

/**
 * Pseudo-type representing an ESModule.
 * Contains exports only.
 */
export class ESModule extends Type {
  /* @internal */ private _declarations: (() => ModuleContent)[]
  /* @internal */ private _default?: () => ModuleContent

  /**
   * Structural Discriminant
   */
  readonly kind = 'ESModule' as const
  /**
   * Unique identifier for the type.
   */
  readonly ref: string
  /**
   * Relative path to the file.
   * Begins at project root.
   */
  readonly fileName: string

  /**
   * Default export of the module, if any.
   */
  get default() {
    return this._default?.()
  }

  /**
   * All exports of the module.
   */
  get declarations() {
    return this._declarations.map(d => d())
  }

  constructor(
    ref: string,
    fileName: string,
    _declarations: (() => ModuleContent)[],
    _default?: () => ModuleContent,
  ) {
    super(fileName)
    this.fileName = fileName
    this.ref = ref
    this._default = _default
    this._declarations = _declarations
  }
}
