const express = require("express");
const sequelize = require("./util/database");
const caching = require("./util/caching");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const { errorHandler } = require("./middlewares/errorHandler");

// Import Models
const Admin = require("./models/Admin");
const CarBrand = require("./models/CarBrand");

require('dotenv').config()

const app = express();

// Body parser
app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Route files
const services = require("./routes/common");
const adminBrand = require("./routes/admin/brand");
const admin = require("./routes/admin");
const adminBlog = require("./routes/admin/blog");

// Mount routers
app.use(services);
app.use(admin);
app.use("/admin/brand", adminBrand);
app.use("/admin/blog", adminBlog);

const PORT = process.env.PORT || 8080;

app.use(errorHandler);


const sync = async () => await sequelize.sync();
sync().then(async () => {
  console.log('Databased Synced!'.yellow
  );
  const admin = await Admin.findOne({
    username: "admin_cp"
  });
  if (!admin) {
    Admin.create({
      email: "admin@carprices.ae",
      password: "Test123",
      username: "admin_cp",
      firstName: "Car Prices",
      lastName: "UAE"
    });
  }
});

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);
