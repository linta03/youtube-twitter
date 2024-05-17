// require('dotenv').config({path :"./env"})
import app from "./app.js";
import connectDatabase from "./db/db.js";
import dotenv from "dotenv";
dotenv.config({ path: "./env" });

connectDatabase()
  .then(() => {
    app.on("error", (err) => {
      console.log(`App Error => ${err}`);
      throw err;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`MONGODB Connection failed !!! ==> ${err}`);
  });
