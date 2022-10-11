export interface Primitives {
  propString: string
  propNumber: number
  propBigInt: bigint
  propBool: boolean
  (x: string, y: number): number
  (y: string, z: string): string
  foo(): string
  foo(x: number): number
}

export type UnionTest = string | number

export class TestClass<T extends string = 'boo'> {
  testProp
  instanceMethod() {}
  static staticProp = 0
  static staticMethod() {}
}

export function overloadedFunction(x: number): void
export function overloadedFunction(x: string): void
export function overloadedFunction(x: string | number) {}

function transitiveExportFn(): void {}

export const ArrayTest = new Array<string>()

export let letTest: Iterable<string>

class FooBoo {
  boo = 'hoo'
}

const x = 'test'

export const lambda = () => 35

export default FooBoo

export { FooBoo as BooHoo, transitiveExportFn, x }
