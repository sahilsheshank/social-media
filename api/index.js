const mongoose = require("mongoose");
const config = require("./config");
const app = require("./app");

const start = async () => {
  await mongoose.connect(config.mongoUrl);
  app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });
};

start().catch((err) => {
  console.error("Failed to start the API:", err);
  process.exit(1);
});
