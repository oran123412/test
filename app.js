import express from "express";
import path from "node:path";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import logger from "./loggers/loggerAdapter.js";
import cors from "cors";
import errorMiddleware from "./middlewares/error.mw.js";
import apiRouter from "./routes/api.router.js";
import dotenv from "dotenv";
import db from "./db.js";
import axios from "axios";

const __dirname = path.resolve(path.dirname("")); // Updated for clarity
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(logger());
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'", "https: data:"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get("/books-detail/:bookId", async (req, res) => {
  console.log("Received request for bookId:", req.params.bookId); // Log the received bookId
  try {
    const { bookId } = req.params;
    console.log("Saving book ID to DB:", bookId);
    await db.saveBookId(bookId);
    console.log("Fetching saved book data from DB:", bookId);
    const savedBookData = await db.getBookData(bookId);
    console.log("Saved book data:", savedBookData); // Log retrieved data
    const price = savedBookData.price;
    res.status(200).json({ bookId: savedBookData.bookId, price: price });
  } catch (err) {
    console.error("Error in book-detail route:", err);
    res.status(404).send(`error occurred ${err}`);
  }
});

app.get("/google-books", async (req, res) => {
  try {
    // Extract query parameters from the client request
    const { q, orderBy } = req.query;

    // Make a request to the Google Books API
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q, // Search query
          orderBy, // Sorting order
          key: process.env.REACT_APP_GOOGLE_BOOKS_API_KEY, // Include the API key securely
        },
      }
    );

    // Forward the response from the Google Books API to the client
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching data from Google Books API:", error);
    // Return an error response to the client
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// app.use(express.static(path.join(__dirname, "build")));
app.get("/api/books", async (req, res) => {
  const { q, maxResults, orderBy } = req.query; // Extract query parameters
  try {
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q: `subject:${q}`, // Build the query string
          maxResults,
          orderBy,
          key: process.env.REACT_APP_GOOGLE_BOOKS_API_KEY, // Include your API key here
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching data from Google Books API:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// This assumes bookId is being correctly parsed as an ObjectId
app.post("/api/books/:bookId/like", async (req, res) => {
  const bookId = req.params.bookId;
  const userId = req.body.userId;
  try {
    console.log("Attempting to like book with ID:", bookId, "by user:", userId);
    const result = await db.likeBook(bookId, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error during like operation:", error);
    res
      .status(500)
      .json({ message: "Failed to like the book", error: error.toString() });
  }
});

app.use("/", apiRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.status(404).send("404: Page Not Found");
});

app.use(errorMiddleware);

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  await db.connect().catch((err) => {
    console.error("Failed to connect to database", err);
    process.exit(1);
  });
});

export default app;
