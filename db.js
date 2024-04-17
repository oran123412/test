import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
const mongoConnectionUrl = process.env.MONGODB_CON_STR;

// DB class responsible for mongo DB interaction
class DB {
  constructor(mongoConnectionUrl) {
    this.mongoClient = new MongoClient(mongoConnectionUrl);
    this.dbName = "booksWebsite";
    this.booksCollectionName = "books";
    this.usersCollectionName = "users";
  }

  async connect() {
    try {
      await this.mongoClient.connect();
      console.log("Connected successfully to DB");
    } catch (error) {
      console.error("Error during DB connection: ", error);
    }
  }

  getCollection(name) {
    return this.mongoClient.db(this.dbName).collection(name);
  }

  async getUserByEmail(email) {
    console.log("Attempting to fetch user by email:", email);
    const usersCollection = this.getCollection(this.usersCollectionName);
    try {
      const user = await usersCollection.findOne({ email });
      console.log("User found:", user);
      return user;
    } catch (error) {
      console.error("Error fetching user from database:", error);
      throw error; // Re-throw the error to handle it further up the call stack
    }
  }

  async createUser(userData) {
    console.log("Attempting to create user:", userData);
    const usersCollection = this.getCollection(this.usersCollectionName);
    const result = await usersCollection.insertOne(userData);
    console.log("User creation result:", result);
    return result;
  }

  async getBookData(id) {
    try {
      const booksCollection = this.getCollection("books");
      const result = await booksCollection.findOne({ id });
      console.log(result);
      return result;
    } catch (error) {
      console.error("Error getting book data: ", error);
    }
  }

  generateRandomPrice(min, max) {
    const price = Math.random() * (max - min) + min;
    const roundPrice = Math.round(price / 5) * 5;
    return roundPrice;
  }
  async likeBook(bookId, userId) {
    const booksCollection = this.getCollection("books");
    // Ensure you're querying the document by 'id', not 'bookId'
    const result = await booksCollection.updateOne(
      { id: bookId }, // Use 'id' here, as this should match your document's structure
      { $addToSet: { likes: userId } } // This adds the userId to 'likes' without duplicates
    );
    console.log("User liked the book:", result);
    return result;
  }

  async unlikeBook(bookId, userId) {
    const booksCollection = this.getCollection("books");
    // Ensure you're querying the document by 'id', not 'bookId'
    const result = await booksCollection.updateOne(
      { id: bookId }, // Use 'id' here, as this should match your document's structure
      { $pull: { likes: userId } } // This removes the userId from 'likes'
    );
    console.log("User unliked the book:", result);
    return result;
  }
  async saveBookId(id) {
    const price = this.generateRandomPrice(20, 100);
    const booksCollection = this.getCollection("books");

    try {
      // Check if the book already exists
      const existingDocument = await booksCollection.findOne({ id });

      if (!existingDocument) {
        // If the book does not exist, add it
        const result = await booksCollection.insertOne({
          id: id,
          price: price,
          likes: [],
        });
        console.log("New book added:", result);
        return result; // Return the result of the insert operation
      } else {
        console.log("Book already exists:", existingDocument);
        // Optionally, you might want to handle updates or other logic here
        return existingDocument; // Return the existing document if no new insertion
      }
    } catch (error) {
      console.error("Error saving book ID:", error);
      throw error; // Re-throw the error to handle it in the caller
    }
  }
}

const db = new DB(mongoConnectionUrl);

export default db;
