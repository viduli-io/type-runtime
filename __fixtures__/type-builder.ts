export interface Primitives {
  propString: string
  propNumber: number
  propBigInt: bigint
  propBool: boolean
  propNull: null
  propUndefined: undefined
  propNever: never
  propAny: any
  propUnknown: unknown
  propSymbol: symbol
  readonly propUniqSymbol: unique symbol
}

export type UnionTest = string | number

export interface HasTypeParam<T> {
  propString: T
  new (x: T)
}

interface Whimsical {
  testProp
}

interface Delusional {
  instanceMethod(): void
}

function testDecorator(
  Ctor: Function | Object,
  key?: string,
  idx?: number,
) {}

@testDecorator
export class TestClass<T extends string = 'boo'>
  implements Whimsical, Delusional
{
  static staticProp = 0

  static staticMethod() {}

  @testDecorator
  public testProp
  private privateProp
  protected protectedProp

  constructor(@testDecorator bac: string) {}

  optionalProp?: string

  @testDecorator
  instanceMethod(@testDecorator bac: string) {}

  readonly readOnlyProp
}

export interface Recursive {
  recursive: Recursive
}

export type GenericTest = HasTypeParam<string>

export interface CallSignatures {
  (x: string, y: number): number
  (y: string, z: string): string
}

export interface Overloads {
  foo(): string
  foo(x: number): number
}

export function overloadedFunction(x: number): void
export function overloadedFunction(x: string): void
export function overloadedFunction(x: string | number) {}

export type IntersectionTest = { a: number } & { b: string }

export type GenericAlias<T> = { a: T }

export type UnionA = string | number

export type UnionB = boolean | bigint

export type UnionContains = UnionA | UnionB

function TestNested() {
  class Nested {
    boo = 'hoo'
  }
  type Boohoo = Nested

  return new Nested()
}

export type TupleTest = [string, number]

export const ArrayTest = new Array<string>()

export const MapTest = new Map<string, number>()

export const SetTest = new Set<string>()

export const PromiseTest = new Promise<string>(r => r('hello'))

export let GenericBuiltIn: Iterable<string>

export enum Haha {
  HooHoo = 'hoohoo',
  HeeHee = 'heehee',
  HiiHii = 'hiihii',
}
