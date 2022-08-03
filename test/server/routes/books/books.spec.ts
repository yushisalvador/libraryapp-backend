require("dotenv").config();

import request from "supertest";
import buildServer from "server";
import { expect } from "chai";

const app = buildServer();
const fixtures = require("../fixtures.ts");
const token = process.env.token;
const auth = { Authorization: "Bearer " + token };

describe("GET /books routes", () => {
  it("should respond with 200", async () => {
    const res = await request(app).get("/books");
    expect(res.statusCode).equals(200);
  });

  it("should respond with 200 when retrieving books for a single user", async () => {
    const res = await request(app)
      .get("/books/mybooks?username=caoh_the_nerd")
      .set(auth);
    expect(res.statusCode).equals(200);
  });
  it("should respond with 401 when retrieving books for a single user, and no header is sent", async () => {
    const res = await request(app).get("/books/mybooks?username=caoh_the_nerd");
    expect(res.statusCode).equals(401);
  });

  it("should return the array of books owned by the user", async () => {
    const expected = [
      {
        id: 3,
        author: "James Clear",
        title: "Atomic Habits",
        date_finished: "2022-03-21T15:00:00.000Z",
        registered_by: "crazy_toffer",
      },
    ];

    const res = await request(app)
      .get("/books/mybooks?username=crazy_toffer")
      .set(auth);
    expect(res.body).to.deep.equal(expected);
    expect(res.statusCode).equals(200);
  });
});

describe("POST /books routes", () => {
  before(async () => {
    await request(app).delete("/books/mybooks?username=testing_1").set(auth);
  });

  after(async () => {
    await request(app).delete("/books/mybooks?username=testing_1").set(auth);
  });

  it("should increment the length of the books in the db ", async () => {
    const book = fixtures.getBook();
    const res1 = await request(app).get("/books");
    const numBooksBefore = res1.body.length;
    await request(app).post("/books").send(book);
    const res2 = await request(app).get("/books");
    const numBooksAfter = res2.body.length;

    expect(numBooksAfter).greaterThan(numBooksBefore);
  });
});

describe("DELETE /books routes", () => {
  let id: Number;
  const addBook = fixtures.getBook();

  before(async () => {
    await request(app).post("/books").send(addBook);
    const currBooks = await request(app)
      .get(`/books/mybooks?username=${addBook.registered_by}`)
      .set(auth);
    const idArr = await currBooks.body.map((book: any) => book.id);
    id = idArr[0];
  });

  after(async () => {
    await request(app).delete(
      `/books/mybooks?username=${addBook.registered_by}`
    );
  });

  it("should decrease the length of the books in the db", async () => {
    const res1 = await request(app).get("/books");
    const prevLength = res1.body.length;
    await request(app).delete(`/books?id=${id}`);
    const res2 = await request(app).get("/books");
    const afterLength = res2.body.length;

    expect(afterLength).lessThan(prevLength);
  });
});

describe("PUT books", () => {
  const addBook = fixtures.getBook();
  const editObj = {
    date_finished: "2022-03-22T15:00:00.000Z",
  };
  beforeEach(async () => {
    await request(app).post("/books").send(addBook);
  });

  afterEach(async () => {
    await request(app)
      .delete(`/books/mybooks?username=${addBook.registered_by}`)
      .set(auth);
  });

  it("should return status 200 when the edit is success", async () => {
    const currBooks = await request(app)
      .get(`/books/mybooks?username=${addBook.registered_by}`)
      .set(auth);

    const idArr = await currBooks.body.map((book: any) => book.id);
    const id = idArr[0];
    const edit = await request(app).put(`/books?id=${id}`).send(editObj);
    expect(edit.statusCode).equals(200);
  });

  it("should modify the object", async () => {
    const currBooks = await request(app)
      .get(`/books/mybooks?username=${addBook.registered_by}`)
      .set(auth);

    const idArr = await currBooks.body.map((book: any) => book.id);
    const id = idArr[0];
    await request(app).put(`/books?id=${id}`).send(editObj);
    const afterBooks = await request(app)
      .get(`/books/mybooks?username=${addBook.registered_by}`)
      .set(auth);
    expect(afterBooks.body).to.not.deep.equal(currBooks.body);
  });
});