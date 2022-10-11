import {
  isAliasType,
  isClassType,
  isInterfaceType,
  isModuleType,
  isType,
} from './types/guards'
import {
  ESModule,
  Type,
  ClassType,
  InterfaceType,
  AliasType,
} from './types'

/**
 * Single source of truth storage for referable types
 * in a project.
 */
export class TypeStore {
  private static typeMap = new Map<string, Type>()
  private static _types?: Type[]
  private static _classes?: ClassType[]
  private static _interfaces: InterfaceType[]
  private static _aliases: AliasType[]

  private constructor() {
    throw new Error(
      'TypeStore is a static class and cannot be instantiated.',
    )
  }

  static get size() {
    return this.typeMap.size
  }

  /**
   * Relative path from output root.
   */
  static get storePath() {
    return 'type-store.cjs'
  }

  static get types(): ReadonlyArray<Type> {
    return (this._types ??= this.filter(isType))
  }

  static get classes(): ReadonlyArray<ClassType> {
    return (this._classes ??= this.filter(isClassType))
  }

  static get interfaces(): ReadonlyArray<InterfaceType> {
    return (this._interfaces ??= this.filter(isInterfaceType))
  }

  static get aliases(): ReadonlyArray<AliasType> {
    return (this._aliases ??= this.filter(isAliasType))
  }

  static get modules(): ReadonlyArray<ESModule> {
    return this.filter(isModuleType)
  }

  static has(id: string) {
    return this.typeMap.has(id)
  }

  static get(id: string) {
    return this.typeMap.get(id)
  }

  static getOrThrow(id: string) {
    const type = this.typeMap.get(id)
    if (!type) throw new Error('Type not found. id: ' + id)
    return type
  }

  static add(type: Type & { ref: string }) {
    if (!type.ref) {
      throw new Error('Attempting to add type with empty ref.')
    } else if (this.typeMap.has(type.ref)) {
      throw new Error('Attempting to override id: ' + type.ref)
    }
    this.typeMap.set(type.ref, type)
  }

  static load(...types: (Type & { ref: string })[]) {
    for (let type of types) {
      this.add(type)
    }
  }

  static filter<T extends Type>(pred: (type: Type) => type is T): T[]
  static filter(pred: (type: Type) => unknown): Type[]
  static filter(pred: (type: Type) => unknown) {
    const results = []
    for (let [, el] of this.typeMap) {
      if (pred(el)) results.push(el)
    }
    return results
  }

  static find<T extends Type>(
    predicate: (value: Type) => value is T,
  ): T | undefined
  static find(predicate: (value: Type) => boolean): Type | undefined
  static find(predicate: (value: Type) => boolean) {
    for (let type of this.types) {
      if (predicate(type)) return type
    }
  }
}
