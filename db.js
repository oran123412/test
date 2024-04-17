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

  async saveBookId(id) {
    let price = this.generateRandomPrice(20, 100);

    try {
      const booksCollection = this.getCollection("books");
      const existingDocument = await booksCollection.findOne({ id });
      console.log({ existingDocument });
      if (!existingDocument) {
        const result = await booksCollection.insertOne({
          id: id,
          price: price,
        });
        console.log("New book added:", result);
        return result;
      } else {
        // If document exists, add the new comment to it

        console.log("Comment added to existing book:", result);
        return result; // Return the result of the update operation
      }
    } catch (error) {
      console.error("Error saving book ID:", error);
      throw error;
    }
  }
}

const db = new DB(mongoConnectionUrl);

export default db;
