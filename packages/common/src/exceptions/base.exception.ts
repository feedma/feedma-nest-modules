export abstract class Exception extends Error {
  abstract status: number;
  abstract code: string;
  abstract defaultMessage: string;

  constructor(message?: string) {
    super(message);
    this.initMessage(message);
  }

  protected initMessage(message?: string) {
    this.message = message || this.defaultMessage;
  }
}
