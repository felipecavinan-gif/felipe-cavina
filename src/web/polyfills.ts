/**
 * Safari (e navegadores mais antigos) não têm Symbol.dispose / Symbol.asyncDispose.
 * A biblioteca de exportação usa dois nomes diferentes para o mesmo símbolo quando ele não existe
 * ("Symbol.dispose" e "dispose"), o que gera o erro "Object not disposable".
 * Definindo aqui, antes de qualquer outra coisa carregar, todo o código passa a usar o mesmo símbolo.
 */
const S = Symbol as unknown as Record<string, symbol | undefined>;
if (typeof S.dispose !== "symbol") Object.defineProperty(Symbol, "dispose", { value: Symbol.for("Symbol.dispose"), configurable: true });
if (typeof S.asyncDispose !== "symbol") Object.defineProperty(Symbol, "asyncDispose", { value: Symbol.for("Symbol.asyncDispose"), configurable: true });

export {};
