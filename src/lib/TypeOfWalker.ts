import ts, { SyntaxKind } from 'typescript'
import { TypeBuilder } from './TypeBuilder'
import { trace, warn } from './util'
import { TypeExpressionFactory } from './TypeExpressionFactory'
import { Type } from './types'
import { isType } from './types/guards'

const _ = undefined

export class TransformationState {
  typeOfFuncs = new Map<ts.SignatureDeclaration, boolean>()
}

/**
 * Transformer for `typeOf` function calls.
 */
export class TypeOfWalker {
  protected checker: ts.TypeChecker
  protected factory = new TypeExpressionFactory()

  constructor(
    protected program: ts.Program,
    protected sourceFile: ts.SourceFile,
    protected ctx: ts.TransformationContext,
    protected tb: TypeBuilder,
    protected state: TransformationState,
  ) {
    this.checker = program.getTypeChecker()
  }

  walk() {
    let shouldImport = false

    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isFunctionLike(node) && node.typeParameters?.length! > 0) {
        node = this.maybeUpdateFuncDec(node)
      }
      if (ts.isClassDeclaration(node)) {
        node = this.addTypeRef(node)
      }
      if (ts.isCallExpression(node)) {
        const funcType = this.checker.getTypeAtLocation(node.expression)
        if (funcType.getProperty('__isTypeOfCall')) {
          shouldImport = true
          const typeToGet = node.typeArguments?.[0]
          if (typeToGet) {
            const tsType = this.checker.getTypeFromTypeNode(typeToGet)
            if (tsType.isTypeParameter()) {
              const symbol = tsType.symbol
              trace('detected type parameter', symbol.name)
              return ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier('__types__'),
                symbol.name,
              )
            } else {
              const type = this.tb.buildType(tsType)()
              return this.factory.makeGetFromStoreOrInline(type)
            }
          } else {
            if (node.arguments.length !== 1) {
              throw new Error('typeOf accepts exactly one argument')
            }
          }
        } else {
          const sig = this.checker.getResolvedSignature(node)
          const dec =
            sig?.declaration ??
            funcType.symbol?.valueDeclaration ??
            funcType.symbol?.declarations![0]

          if (dec && ts.isFunctionLike(dec)) {
            let hasTypeOf: boolean
            if (this.state.typeOfFuncs.has(dec)) {
              hasTypeOf = this.state.typeOfFuncs.get(dec)!
            } else {
              hasTypeOf = this.hasTypeOf(dec)
              this.state.typeOfFuncs.set(dec, hasTypeOf)
            }
            if (hasTypeOf) {
              const nMissing =
                (sig ?? dec).parameters.length - node.arguments.length

              const typeArgs = this.getOrInferTypeArguments(sig, dec, node)
              node = ts.factory.updateCallExpression(
                node,
                node.expression,
                node.typeArguments,
                [
                  ...node.arguments,
                  ...Array.from({ length: nMissing }).map(x =>
                    ts.factory.createVoidZero(),
                  ),
                  ts.factory.createObjectLiteralExpression(
                    dec.typeParameters?.map(ta => {
                      const tsType = typeArgs[ta.name.text]
                      const type = isType(tsType)
                        ? tsType
                        : !!tsType
                        ? this.tb.buildType(tsType)()
                        : Type.Unknown
                      return ts.factory.createPropertyAssignment(
                        ta.name.text,
                        this.factory.makeGetFromStoreOrInline(type),
                      )
                    }),
                  ),
                ],
              )
              shouldImport = true
            }
          }
        }
      }
      return ts.visitEachChild(node, visitor, this.ctx)
    }
    this.sourceFile = ts.visitNode(this.sourceFile, visitor)
    if (shouldImport) this.addImport()
    return this.sourceFile
  }

  private maybeUpdateFuncDec(node: ts.SignatureDeclaration) {
    // lookahead for `typeOf` call
    const hasTypeOf = this.hasTypeOf(node)
    this.state.typeOfFuncs.set(node, hasTypeOf)
    if (hasTypeOf && node.parameters.find(p => !!p.dotDotDotToken)) {
      throw new Error('typeOf inside rest parameters are not supported')
    }
    this.checker.getSymbolAtLocation(node)
    if (!hasTypeOf) return node

    if (ts.isFunctionDeclaration(node))
      return ts.factory.updateFunctionDeclaration(
        node,
        node.modifiers,
        node.asteriskToken,
        node.name,
        node.typeParameters,
        [
          ...node.parameters,
          ts.factory.createParameterDeclaration(_, _, '__types__'),
        ],
        node.type,
        node.body,
      )
    if (ts.isMethodDeclaration(node))
      return ts.factory.updateMethodDeclaration(
        node,
        node.modifiers,
        node.asteriskToken,
        node.name,
        node.questionToken,
        node.typeParameters,
        [
          ...node.parameters,
          ts.factory.createParameterDeclaration(_, _, '__types__'),
        ],
        node.type,
        node.body,
      )
    return node
  }

  private addImport() {
    this.sourceFile = ts.factory.updateSourceFile(this.sourceFile, [
      ts.factory.createImportDeclaration(
        _,
        ts.factory.createImportClause(
          false,
          _,
          ts.factory.createNamespaceImport(this.factory.typeLib),
        ),
        ts.factory.createStringLiteral('type-runtime'),
      ),
      ...this.sourceFile.statements,
    ])
  }

  private hasTypeOf(node: ts.SignatureDeclaration) {
    let hasTypeOf = false
    const lookAhead = (node: ts.Node): ts.Node => {
      if (ts.isCallExpression(node)) {
        const callType = this.checker.getTypeAtLocation(node.expression)
        if (callType.getProperty('__isTypeOfCall')) {
          hasTypeOf = true
          return node
        }
      }
      return ts.visitEachChild(node, lookAhead, this.ctx)
    }
    ts.visitEachChild(node, lookAhead, this.ctx)
    trace(`${node.name?.getText()} hasTypeOf ${hasTypeOf}`)
    return hasTypeOf
  }

  private getOrInferTypeArguments(
    sig: ts.Signature | undefined,
    dec: ts.SignatureDeclaration,
    node: ts.CallExpression,
  ) {
    // console.log(this.checker.typeToString(type))
    const tp = dec.typeParameters ?? []
    const ta = node.typeArguments ?? []
    const results: Record<string, ts.Type | Type> = {}
    for (let i = 0; i < tp.length; i++) {
      const typeParam = tp[i]
      const typeArg = ta[i]
      const name = typeParam.name.text

      if (typeArg) {
        results[name] = this.checker.getTypeFromTypeNode(typeArg)
        continue
      }
      // infer the type of the parameter from the resolved signature
      for (let j = 0; j < dec.parameters.length; j++) {
        const param = dec.parameters[j]
        const expression = node.arguments[j]
        let paramType = this.checker.getTypeAtLocation(param)
        if (this.checker.isOptionalParameter(param))
          paramType = this.checker.getNonNullableType(paramType)

        console.log(this.checker.typeToString(paramType))
        if (paramType.isTypeParameter()) {
          if (paramType.symbol.name === name) {
            if (expression) {
              results[name] = this.checker.getTypeAtLocation(expression)
              break
            }
          }
        }
        const ata =
          paramType.aliasTypeArguments ??
          this.checker.getTypeArguments(paramType as ts.TypeReference)
        if (sig && ata) {
          const param = sig.parameters[i]
          if (!param) continue
          const type = this.checker.getNonNullableType(
            this.checker.getTypeOfSymbolAtLocation(param, node),
          )
          trace(`parameter i: ${i} is ${this.checker.typeToString(type)}`)

          for (let k = 0; k < ata.length; k++) {
            const typeArg = ata[k]
            if (!typeArg.symbol) {
              warn('expected type arg to have symbol ', typeArg)
            }
            if (typeArg.symbol.name === name) {
              if (expression) {
                const typeParams = this.checker.getTypeArguments(
                  type as ts.TypeReference,
                )
                results[name] = typeParams[k]
                break
              }
            }
          }
          // break out of k loop to j loop
          if (results[name]) break
        }
        // break out of j loop to i loop
        if (results[name]) break
      }
      if (results[name]) continue
      // check for defaults
      if (typeParam.default) {
        const type = this.checker.getTypeFromTypeNode(typeParam.default)
        results[name] = type.isTypeParameter() ? Type.Unknown : type
      }
    }
    return results
  }

  private addTypeRef(node: ts.ClassDeclaration) {
    return ts.factory.updateClassDeclaration(
      node,
      node.modifiers,
      node.name,
      node.typeParameters,
      node.heritageClauses,
      [
        ts.factory.createPropertyDeclaration(
          [ts.factory.createModifier(SyntaxKind.StaticKeyword)],
          '__typeRef',
          undefined,
          undefined,
          ts.factory.createStringLiteral(
            this.tb.calculateId(this.checker.getTypeAtLocation(node)),
          ),
        ),
        ...node.members,
      ],
    )
  }
}
