export interface Case1 {
  boo: () => string
  hoo: {
    new (): string
    (): string
  }
}

export function boohoo() {}
