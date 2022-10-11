import ts, { SyntaxKind } from 'typescript'

/**
 * ATTENTION! Do not use in production. Creating errors are very costly.
 */
export const attention =
  process.env.ATTENTION === 'true'
    ? (...args: any[]) => {
        const loc = new Error().stack?.split('\n')[2] ?? ''
        const matches = /\/([^/]*.)\)/.exec(loc)
        const cs = matches?.[1]
        console.log('\x1b[31m%s\x1b[0m', 'Attention!', cs, ...args)
      }
    : (...args: any[]) => {}

export const trace =
  process.env.TRACE === 'true'
    ? (...args: any[]) => {
        const loc = new Error().stack?.split('\n')[2] ?? ''
        const cs = loc
          ?.split(/[\/\\]/)
          .at(-1)
          ?.replace(/\)$/, '')
        console.log('trace', cs ?? '', ...args)
      }
    : (...args: any[]) => {}

export const warn =
  process.env.TRACE === 'true'
    ? (...args: any[]) => {
        const loc = new Error().stack?.split('\n')[2]
        const cs = loc
          ?.split(/[\/\\]/)
          .at(-1)
          ?.replace(/\)$/, '')
        console.log('\x1b[33m warn', cs ?? '', ...args, '\x1b[0m')
      }
    : (...args: any[]) => {}

export const hasFlag = <T extends number>(x: T, y: T) => (x & y) === y

export const inspectTsType = (type: ts.Type) => {
  const {
    // @ts-ignore
    checker,
    // @ts-ignore
    immediateBaseConstraint,
    // @ts-ignore
    objectFlags,
    // @ts-ignore
    freshType,
    // @ts-ignore
    regularType,
    symbol,
    ...rest
  } = type
  return {
    ...rest,
    name: symbol?.name,
    flags: getTypeFlags(type),
  }
}

export function inspectFlags(
  x: number,
  flag: Record<string | number, number | string>,
) {
  let results = []
  for (let key in flag) {
    const value = flag[key]
    if (typeof value !== 'number') continue
    const bit = x & value
    if (bit) {
      let typeFlag = flag[bit]
      results.push(typeFlag)
    }
  }
  return [...new Set(results)].join(', ')
}

export const inspectSymbol = (s: ts.Symbol) => {
  // @ts-ignore
  const { checker, parent, declarations, valueDeclaration, ...rest } = s
  return {
    ...rest,
    flags: inspectFlags(s.flags, ts.SymbolFlags),
    declarations: declarations?.map(inspectDec),
  }
}

export const inspectDec = (d: ts.Declaration) => {
  // @ts-ignore
  const { checker, parent, symbol, kind, ...rest } = d
  return {
    ...rest,
    kind: SyntaxKind[kind],
    text: d.getFullText(),
    flags: inspectFlags(d.flags, ts.NodeFlags),
  }
}

export const inspectParents = (d: ts.Declaration) => {
  let parent: ts.Node = d.parent
  while (parent) {
    console.log(SyntaxKind[parent.kind])
    console.log(parent.getFullText())
    parent = parent.parent
  }
}

export function getTypeFlags(tsType: ts.Type) {
  let results = new Set<string>()
  for (let i = 1; i < 536_624_127; i *= 2) {
    const bit = tsType.flags & i
    if (bit) {
      let typeFlag = ts.TypeFlags[bit]
      if (typeFlag === 'IncludesMissingType') typeFlag = 'TypeParameter'
      results.add(typeFlag)
    }
  }
  const objectFlags = (tsType as ts.ObjectType).objectFlags
  if (objectFlags) {
    for (let i = 1; i < 8_388_608; i *= 2) {
      const bit = objectFlags & i
      if (bit) {
        results.add(ts.ObjectFlags[bit])
      }
    }
    return [...results].join(', ')
  }
}

interface Equatable {
  equals(other: this): boolean
}

export function setEquals<T>(
  setA: readonly Equatable[],
  setB: readonly Equatable[],
) {
  if (setA.length !== setB.length) return false
  for (let property of setA) {
    let foundMatch = false
    for (let otherProp of setB) {
      foundMatch = property.equals(otherProp)
    }
    if (!foundMatch) return false
  }
  return true
}

export const merge = <T extends {}>(obj: T, parts: Partial<T>) =>
  Object.assign(obj, parts)
