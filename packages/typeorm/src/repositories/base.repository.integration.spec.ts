import 'reflect-metadata';
import {
  Column,
  DataSource,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseRepository } from './base.repository';

/**
 * These run against a real SQL engine on purpose.
 *
 * The failure this guards against is invisible to a mocked test: pagination
 * over a join is correct or truncated depending on whether the query offsets
 * entities or raw rows, and only a database that actually performs the join
 * can tell the two apart. A repository double would report success either way.
 *
 * sql.js is a WebAssembly build of SQLite, so it needs no native compilation
 * and behaves the same on every Node line the matrix runs.
 */

// `Author` is declared first because `emitDecoratorMetadata` resolves a
// property's type at class-definition time: `author: Author` inside `Book`
// would read the binding before it exists. The reverse side is an array, whose
// emitted type is `Array`, so it carries no such reference.
@Entity()
class Author {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Book, (book) => book.author)
  books: Book[];
}

@Entity()
class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => Author, (author) => author.books)
  @JoinColumn({ name: 'authorId' })
  author: Author;
}

describe('BaseRepository against a database', () => {
  let dataSource: DataSource;
  let repository: BaseRepository<Author>;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqljs',
      entities: [Author, Book],
      synchronize: true,
      logging: false,
    });
    await dataSource.initialize();
    repository = new BaseRepository(Author, dataSource);
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  async function seed(authors: number, booksEach: number): Promise<void> {
    for (let a = 1; a <= authors; a++) {
      const author = await dataSource
        .getRepository(Author)
        .save(dataSource.getRepository(Author).create({ name: `author-${a}` }));

      for (let b = 1; b <= booksEach; b++) {
        await dataSource
          .getRepository(Book)
          .save(dataSource.getRepository(Book).create({ title: `book-${a}-${b}`, author }));
      }
    }
  }

  function authorsWithBooks() {
    return repository
      .createQueryBuilder('author')
      .leftJoinAndSelect('author.books', 'book')
      .orderBy('author.id', 'ASC');
  }

  describe('a query builder that joins', () => {
    it('returns a full page of entities rather than a page of joined rows', async () => {
      // Three authors, three books each: nine joined rows. Offsetting raw rows
      // would fill a page of two with the first author alone, and hand back the
      // second one missing most of its books.
      await seed(3, 3);

      const page = await repository.paginate(authorsWithBooks(), { page: 1, limit: 2 });

      expect(page.items).toHaveLength(2);
      expect(page.items.map((author) => author.name)).toEqual(['author-1', 'author-2']);
      expect(page.items[0].books).toHaveLength(3);
      expect(page.items[1].books).toHaveLength(3);
    });

    it('counts entities rather than joined rows', async () => {
      await seed(3, 3);

      const page = await repository.paginate(authorsWithBooks(), { page: 1, limit: 2 });

      // Nine rows come back from the join; three authors exist. Counting rows
      // would report nine items and five pages.
      expect(page.pagination.totalItems).toBe(3);
      expect(page.pagination.totalPages).toBe(2);
    });

    it('carries the join through to the last page', async () => {
      await seed(3, 3);

      const page = await repository.paginate(authorsWithBooks(), { page: 2, limit: 2 });

      expect(page.items).toHaveLength(1);
      expect(page.items[0].name).toBe('author-3');
      expect(page.items[0].books).toHaveLength(3);
    });
  });

  describe('the repository branch', () => {
    it('paginates and counts with the given find options', async () => {
      await seed(3, 1);

      const page = await repository.paginate(
        { page: 1, limit: 2 },
        { where: { name: 'author-2' } },
      );

      expect(page.items.map((author) => author.name)).toEqual(['author-2']);
      expect(page.pagination.totalItems).toBe(1);
    });

    it('does not let find options override the requested page size', async () => {
      // `itemsPerPage` reports the limit, so a stray `take` winning would make
      // the contract describe a page that was never returned.
      await seed(5, 0);

      const page = await repository.paginate({ page: 1, limit: 2 }, { take: 4, skip: 3 });

      expect(page.items).toHaveLength(2);
      expect(page.pagination.itemsPerPage).toBe(2);
    });
  });

  describe('pages outside the result set', () => {
    it('keeps navigation for a page past the last one', async () => {
      await seed(3, 0);

      const page = await repository.paginate({ page: 99, limit: 2 });

      expect(page.items).toEqual([]);
      expect(page.pagination).toEqual({
        totalItems: 3,
        itemsPerPage: 2,
        totalPages: 2,
        firstPage: 1,
        lastPage: 2,
        page: 99,
      });
    });

    it('keeps navigation for a page below one, and counts rather than assuming', async () => {
      await seed(3, 0);

      const page = await repository.paginate({ page: 0, limit: 2 });

      expect(page.items).toEqual([]);
      expect(page.pagination.totalItems).toBe(3);
      expect(page.pagination.firstPage).toBe(1);
      expect(page.pagination.lastPage).toBe(2);
      expect(page.pagination.page).toBe(0);
    });

    it('does the same for a query builder below page one', async () => {
      await seed(3, 3);

      const page = await repository.paginate(authorsWithBooks(), { page: -1, limit: 2 });

      expect(page.items).toEqual([]);
      expect(page.pagination.totalItems).toBe(3);
      expect(page.pagination.firstPage).toBe(1);
    });

    it('reports no navigation when the result set is empty', async () => {
      const page = await repository.paginate({ page: 1, limit: 2 });

      expect(page.items).toEqual([]);
      expect(page.pagination.totalItems).toBe(0);
      expect(page.pagination.totalPages).toBe(0);
      expect(page.pagination.firstPage).toBeNull();
      expect(page.pagination.lastPage).toBeNull();
    });
  });
});
