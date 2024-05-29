import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connetion = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`\n mongoDB connected ! DB HOST: ${connetion.connection.host}`);
  } catch (error) {
    console.log("mongoDB connection Failed", error);
    process.exit(1);
  }
};

export default connectDB;
