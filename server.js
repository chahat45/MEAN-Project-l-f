const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // help to load html

//connection to database : mongo db (mongoose)
mongoose.connect("mongodb://127.0.0.1:27017/lostfound")
.then(() => {
  console.log("MongoDB Connected");
})
.catch((err) => {
  console.log(err);
});

// importing routes
const itemRoutes = require("./routes/items");
app.use("/items", itemRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

