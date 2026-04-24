const mongoose = require("mongoose");

const connectDatabase = async () => {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  mongoose.set("strictQuery", false);

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log("MongoDB connection Success");
};

module.exports = {
  connectDatabase,
};
