require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/database");

connectDB()
  .then(() => {
    console.log("Database connected successfully...");
    app.listen(process.env.PORT, () => {
      console.log(`server is running on port ${process.env.PORT}...`);
    });
  })
  .catch((err) => {
    console.log("Database connection failed... " + err);
    process.exit(1);
  });
