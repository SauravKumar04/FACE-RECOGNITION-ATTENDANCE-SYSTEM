const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const app = require("./src/app");

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/face-attendance";

connectDB(mongoUri).then(() => {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (error) => {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  });
});

module.exports = app;