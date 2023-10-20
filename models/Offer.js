const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: {
    type: String,
    maxlength: [50, "Must have miximun 50 characters, got {VALUE}"],
  },
  product_description: {
    type: String,
    maxlength: [500, "Must have miximun 500 characters, got {VALUE}"],
  },
  product_price: {
    type: Number,
    max: [100000, "Must be miximun 100000 €, got {VALUE}€"],
  },
  product_details: Array,
  product_image: Object,
  product_pictures: Array,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;
