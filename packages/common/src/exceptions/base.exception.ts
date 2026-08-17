export abstract class Exception extends Error {
  abstract status: number;
  abstract code: string;
  abstract defaultMessage: string;

  // Resolved on access rather than in a constructor. A derived class runs its
  // field initialisers only after `super()` returns, so a base constructor
  // reading `defaultMessage` sees it unassigned and every subclass declaring
  // plain fields ends up with no message at all.
  //
  // `Error` creates an own `message` property only when it is given one, so
  // this getter answers exactly when there is nothing explicit to prefer, and
  // an explicit message shadows it.
  get message(): string {
    return this.defaultMessage;
  }

  // Without this, assigning to `message` throws in strict mode: the property
  // resolves to a getter-only accessor on the prototype.
  set message(value: string) {
    Object.defineProperty(this, 'message', {
      value,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }
}
