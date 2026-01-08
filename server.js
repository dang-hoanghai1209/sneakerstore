require("dotenv").config();

const express = require("express");
const path = require("path");

const productsRoutes = require("./routes/productsRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");

const app = express();
const PORT = process.env.PORT || 8080;

const publicDir = __dirname;

app.use(express.json());
app.use(express.static(publicDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/newproducts", (req, res) => {
  res.sendFile(path.join(publicDir, "newproducts.html"));
});

app.get("/giaysneaker", (req, res) => {
  res.sendFile(path.join(publicDir, "giaysneaker.html"));
});

app.get("/sneakers", (req, res) => {
  res.redirect("/giaysneaker");
});

app.get("/bestsellers", (req, res) => {
  res.sendFile(path.join(publicDir, "bestsellers.html"));
});

app.get("/sale", (req, res) => {
  res.sendFile(path.join(publicDir, "sale.html"));
});

app.get("/support", (req, res) => {
  res.sendFile(path.join(publicDir, "support.html"));
});

app.get("/brand/:brand", (req, res) => {
  const brand = String(req.params.brand || "");
  res.redirect(`/giaysneaker?brand=${brand}`);
});

app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
