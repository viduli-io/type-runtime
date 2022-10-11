export interface KitchenSink {
  (): number
  (a: string): number
  new (): KitchenSink
  new (x: string): KitchenSink
  foo: string
  boohoo(): string
}

export interface AnotherSink {
  bar: 'bar'
}

export interface Blip extends KitchenSink, AnotherSink {
  bloop: 'blap'
}

export interface NestedCall {
  boohoo: {
    (): string
    (x: string): number
  }
}
