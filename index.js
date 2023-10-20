require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const app = express();
app.use(cors());
app.use(express.json());

//connexion à mon compte cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

//connexion à la BDD
mongoose.connect(process.env.MONGODB_URI);

//Import routes
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

//Gestion des pages 404
app.all("*", (req, res) => {
  res.status(404).json({ message: "Vinted :This page does not exist" });
});

//lancement du serveur
// le port 3000 est seulement en local... on laissera le serveur définir le port en production
//La valeur du port=3000 on la stock dans le fichier .env qui reste en local qui sera different de celui qu'on enverra en prod
app.listen(process.env.PORT, () => {
  console.log("Serverd started...");
});
