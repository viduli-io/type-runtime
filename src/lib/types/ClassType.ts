import { Type } from './Type'
import { ConstructSignature } from './ConstructSignature'
import { Decorator } from './Decorator'
import { Property } from './Property'
import { Method } from './Method'
import { inspect } from 'node:util'
import { FunctionType, TypeRetriever } from './index'
import { TypeParameter } from './TypeParameter'
import { IndexSignature } from './IndexSignature'
import { assertClassType } from './guards'
import { ObjectLike } from './ObjectLike'

/**
 * Information about the location of the class within the project
 */
export interface ClassLocation {
  /**
   * Relative path to the module containing the class. This is relative to the
   * project output root.
   */
  fileName: string
  /**
   * Export name of the class
   */
  exportName: string
}

/**
 * Represents static members of a class
 */
export interface Statics {
  /**
   * Static properties of the class
   */
  properties: Property[]
  /**
   * Static methods of the class
   */
  methods: Method[]
}

/**
 * Class definition
 */
export interface Class<
  T = unknown,
  TArgs extends Array<unknown> = unknown[],
> {
  new (...args: TArgs): T
}

/**
 * Type information of a class
 */
export class ClassType extends Type implements ObjectLike {
  /* @internal */ #superType?: () => ClassType
  /* @internal */ #implementedTypes: TypeRetriever[]
  /* @internal */ private _superType?: ClassType
  /* @internal */ private _implementsTypes?: Type[]

  /**
   * Structural discriminant
   */
  readonly kind = 'Class' as const
  /**
   * Unique identifier for the type
   */
  readonly ref: string
  /**
   * Properties of the class
   */
  readonly properties: readonly Property[]
  /**
   * Methods of the class
   */
  readonly methods: readonly Method[]
  /**
   * Type parameters of the class
   */
  readonly typeParameters: readonly TypeParameter[]
  /**
   * Constructor signatures of the class
   */
  readonly constructors: readonly ConstructSignature[]
  /**
   * Index signatures of the class
   */
  readonly indexes: readonly IndexSignature[]
  /**
   * Decorators placed on the class declaration
   */
  readonly decorators: readonly Decorator[]
  /**
   * Static members of the class
   */
  readonly static: Statics
  /**
   * Static location
   */
  readonly location: ClassLocation | undefined

  /**
   * Class that this class extends, if any.
   */
  get superType(): ClassType | undefined {
    return (this._superType ??= this.#superType?.())
  }

  /**
   * Types that this class implements
   */
  get implementsTypes(): Type[] {
    return (this._implementsTypes ??=
      this.#implementedTypes.map(t => t()) ?? [])
  }

  constructor(
    ref: string,
    name: string,
    properties: Property[],
    methods: Method[],
    superType: (() => ClassType) | undefined,
    implementedTypes: TypeRetriever[],
    typeParameters: TypeParameter[],
    location: ClassLocation | undefined,
    constructSignatures: ConstructSignature[],
    decorators: Decorator[],
    statics: Statics,
    indexSigs: readonly IndexSignature[],
  ) {
    super(name)
    this.#superType = superType
    this.#implementedTypes = implementedTypes
    this.ref = ref
    this.properties = properties
    this.methods = methods
    this.typeParameters = typeParameters
    this.location = location
    this.constructors = constructSignatures
    this.indexes = indexSigs
    this.decorators = decorators
    this.static = statics
  }

  /**
   * Checks the inheritance chain of this class for the given class. Returns
   * true if this class is inherited from the given class.
   * @param classType
   */
  extendsFrom(classType: ClassType): boolean {
    let temp: ClassType | undefined = this
    while (temp) {
      if (temp?.is(classType)) return true
      temp = temp.superType
    }
    return false
  }

  /**
   * Check whether this class has being decorated with the given function
   * type.
   * @param type
   */
  hasDecorator(type: FunctionType): boolean {
    return this.decorators.some(d => d.type.is(type))
  }

  /**
   * Get a property of this class by name. Throws if a property with the
   * given name doesn't exist.
   * @param name
   */
  getProperty(name: string): Property {
    const prop = this.properties.find(t => t.name === name)
    if (!prop) throw new Error('Property not found')
    return prop
  }

  /**
   * Get a method of this class by name. Throws if a method with the
   * given name doesn't exist.
   * @param name
   */
  getMethod(name: string): Method {
    const prop = this.methods.find(t => t.name === name)
    if (!prop) throw new Error('Method not found')
    return prop
  }

  /**
   * Imports the module containing the class into the current context
   * and returns a reference to the class.
   * You can use this import to instantiate new objects of the type.
   * Throws if the class cannot be imported.
   * @example
   * const Foo = await FooType.import()
   * const obj = new Foo!()
   */
  import(): Promise<Class> {
    const desc = this.location
    if (desc) {
      return import(desc.fileName).then(module => module[desc.exportName])
    }
    throw new Error(
      `Unable to import class ${this.name}. ` +
        `The class may not being exported from the module.`,
    )
  }

  [inspect.custom]() {
    this.superType
    this.implementsTypes
    return this
  }
}
