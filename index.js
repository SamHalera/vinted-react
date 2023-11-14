require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Offer = require("./models/Offer");
const cloudinary = require("cloudinary").v2;
const filterOffer = require("./utils/filterOffer");
const isAuthenticated = require("./middlewares/isAuthenticated");
const app = express();
app.use(cors());
app.use(express.json());

//connect to my cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

//connect to DB
mongoose.connect(process.env.MONGODB_URI);

//Test slow request in order to test a front displaying spinner
const addDelay = async (req, res, next) => {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  next();
};
// app.use(addDelay);
//Import routes (for user and offer)
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

//home page get all offers
app.get("/", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    //Retrieve offers = all offers or dipending on filters
    const offers = await filterOffer(
      title,
      priceMin,
      priceMax,
      sort,
      page,
      true
    );
    console.log("Returning Offers ARRAY ...");
    const offersLength = await Offer.countDocuments();
    // if (offers.length === 0) {
    //   res.status(204).json({ message: "Aucune offre n'a été trouvée!" });
    // } else {
    //   res.status(200).json({
    //     count: offersLength,
    //     offers: offers,
    //   });
    // }
    res.status(200).json({
      count: offersLength,
      offers: offers,
    });
  } catch (error) {
    console.log("Inside catch");
    res.status(500).json({ message: error.message });
  }
});

//Deal with not found page (404)
app.all("*", (req, res) => {
  res.status(404).json({ message: "Vinted :This page does not exist" });
});

//Start the server
// port 3000 just for local dev... we let the prod server to listent to its own port

app.listen(process.env.PORT, () => {
  console.log("Serverd started...");
});
