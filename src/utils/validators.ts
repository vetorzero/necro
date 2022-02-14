import { upperFirst } from "lodash/fp";

type Validator<T> = (value: T) => string | true;

export function notEmpty(fieldName: string): Validator<string> {
  return (value: string) =>
    value.length < 1 ? `${upperFirst(fieldName)} should not be empty.` : true;
}
