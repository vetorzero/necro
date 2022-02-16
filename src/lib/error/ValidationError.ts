export class ValidationError extends Error {
  constructor(public errorsText: string) {
    super();
    this.message = errorsText;
  }
}
