import mongoose from "mongoose";

export const connectToMongo = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URL);
    console.log(`Mongo connected with ${connection.host}`);
  } catch (error) {
    console.log(error);
  }
};
