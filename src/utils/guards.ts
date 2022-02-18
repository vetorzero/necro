/**
 * function required for type narrowing
 * @see https://github.com/microsoft/TypeScript/issues/20812
 */
export function isString(x: any): x is string {
  return typeof x === "string";
}
