import { Exception } from './base.exception';

// Declared with plain fields on purpose. A derived class runs its field
// initialisers after `super()` returns, so anything the base reads during
// construction sees them unassigned — which is what this file pins down.
class BookNotFoundException extends Exception {
  status = 404;
  code = 'BOOK_NOT_FOUND';
  defaultMessage = 'Book not found';
}

class BookLockedException extends Exception {
  status = 423;
  code = 'BOOK_LOCKED';
  defaultMessage = 'Book is locked';

  constructor(private readonly until?: string) {
    super();
  }

  get message(): string {
    return this.until ? `Book is locked until ${this.until}` : this.defaultMessage;
  }
}

// The shape consumers adopted to work around the defect. It must keep working.
class ForbiddenException extends Exception {
  get status(): number {
    return 403;
  }
  get code(): string {
    return 'FORBIDDEN';
  }
  get defaultMessage(): string {
    return 'Not allowed';
  }
}

describe('Exception', () => {
  it('falls back to the default message of a subclass declaring plain fields', () => {
    expect(new BookNotFoundException().message).toBe('Book not found');
  });

  it('prefers an explicit message over the default', () => {
    expect(new BookNotFoundException('That book was deleted').message).toBe(
      'That book was deleted',
    );
  });

  it('exposes the status and code of the subclass', () => {
    const exception = new BookNotFoundException();
    expect(exception.status).toBe(404);
    expect(exception.code).toBe('BOOK_NOT_FOUND');
  });

  it('lets a subclass compose the message from its own state', () => {
    expect(new BookLockedException('2026-09-01').message).toBe('Book is locked until 2026-09-01');
    expect(new BookLockedException().message).toBe('Book is locked');
  });

  it('supports a subclass declaring its members as getters', () => {
    const exception = new ForbiddenException();
    expect(exception.status).toBe(403);
    expect(exception.code).toBe('FORBIDDEN');
    expect(exception.message).toBe('Not allowed');
  });

  it('remains a well-formed Error', () => {
    const exception = new BookNotFoundException();
    expect(exception).toBeInstanceOf(Error);
    expect(typeof exception.stack).toBe('string');
    expect(String(exception)).toBe('Error: Book not found');
  });

  it('allows the message to be reassigned', () => {
    const exception = new BookNotFoundException();
    exception.message = 'Replaced';
    expect(exception.message).toBe('Replaced');
  });
});
