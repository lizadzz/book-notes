//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const pg = require('pg');

const app = express();

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booknotes",
  password: "ilovepostgres",
  port: 5432,
});
db.connect();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  let sortBy = req.query.sortBy || 'id'; // Default sorting by ID
  let sortOrder = req.query.sortOrder || 'ASC'; // Default sorting order

  try {
    const result = await db.query(`SELECT * FROM books ORDER BY ${sortBy} ${sortOrder}`);
    const books = result.rows;

    res.render("home.ejs", {
      books: books,
      sortBy: sortBy,
      sortOrder: sortOrder
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});
  
app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", async (req, res) => {
  const { title, author, isbn, date_read, rating, notes, cover_url } = req.body;
  const query = {
    text: 'INSERT INTO books(title, author, isbn, date_read, rating, notes, cover_url) VALUES($1, $2, $3, $4, $5, $6, $7)',
    values: [title, author, isbn, date_read, rating, notes, cover_url],
  };

  try {
    const result = await db.query(query);
    console.log('Book added successfully');
    res.redirect("/"); // Redirect to home page or any other page
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/books/:bookId", async (req, res) => {
  const requestedBookId = req.params.bookId;

  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [requestedBookId]);
    const book = result.rows[0];
    if (!book) {
      return res.status(404).send("Book not found");
    }
    res.render("book", { book });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/delete", async (req, res) => {
  const { deleteBookId } = req.body;

  try {
    await db.query("DELETE FROM books WHERE id = $1", [deleteBookId]);
    console.log('Book deleted successfully');
    res.redirect("/"); // Redirect to home page or any other page
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/books/:bookId/edit", async (req, res) => {
  const requestedBookId = req.params.bookId;

  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [requestedBookId]);
    const book = result.rows[0];
    if (!book) {
      return res.status(404).send("Book not found");
    }
    res.render("edit", { book });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/update", async (req, res) => {
  const { editBookId, editTitle, editAuthor, editIsbn, editDateRead, editRating, editNotes, editCoverUrl } = req.body;
  const query = {
    text: 'UPDATE books SET title = $1, author = $2, isbn = $3, date_read = $4, rating = $5, notes = $6, cover_url = $7 WHERE id = $8',
    values: [editTitle, editAuthor, editIsbn, editDateRead, editRating, editNotes, editCoverUrl, editBookId],
  };

  try {
    const result = await db.query(query);
    console.log('Book updated successfully');
    res.redirect("/"); // Redirect to home page or any other page
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/contact", function(req, res){
  res.render("contact");
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});