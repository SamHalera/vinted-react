const express = require("express");
const Offer = require("../models/Offer");
const User = require("../models/User");
const fileUpload = require("express-fileupload");
const convertToBase64 = require("../utils/convertToBase64");
const filterOffer = require("../utils/filterOffer");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");

const router = express.Router();

//Je convert le buffer du req.files.picture en base64 pour le stocker sur cloudinary
// const convertToBase64 = (file) => {
//   return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
// }; ==> on a mis cette fonction dans le repertoire ../utils

//avec isAuthenticated on vérifie d'abord si l'utilisateur est authorisé à accéder à la route en question
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    console.log("After isAuthenticated and Before try");

    try {
      console.log("Inside try");
      //Grace au middleware isAuthenticated() je vais en BDD
      // pour chercher l'utilisateur dont le token est celui reçu vie le headers
      //à ce stade si mon middleware ne trouve pas de user ça return un message d'erreur 401
      // si non le script continue ci après

      const {
        title,
        description,
        price,
        condition,
        city,
        brand,
        size,
        color,
        payment,
      } = req.body;

      //une instance du model Offer, sans l'image que nous allons traiter par la suite
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ETAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
          {
            MODE_PAYEMENT: payment,
          },
        ],
        //product_image: pictureToSave,
        owner: req.user, // req.user contiendra que les infos demandées via les select de isAuthenticated. Mongoose mettre en base que l'ObecttId de user
        //la response contiendra toutes les infos automatiquement populate
      });

      if (req.files) {
        //J'enregistre dans cloudinary mon image
        //const offersFolder = "/vinted/offers/" + offer._id;
        const offersFolder = await cloudinary.api.create_folder(
          `/vinted/offers/${newOffer._id}`
        );
        if (req.files.picture) {
          //Tranformation de l'image en string avant save sur cloudinary
          const pictureToUpload = req.files.picture;
          const transformedPicture = convertToBase64(pictureToUpload);
          //console.log(pictureToUpload);

          const pictureToSave = await cloudinary.uploader.upload(
            transformedPicture,
            { folder: offersFolder.path }
          );

          newOffer.product_image = pictureToSave;
        }
        if (req.files.pictures) {
          const arrayOfPicturesUrl = [];
          const picturesToUpload = req.files.pictures;
          for (let i = 0; i < picturesToUpload.length; i++) {
            const onePicture = picturesToUpload[i];
            const onePictureToSave = await cloudinary.uploader.upload(
              convertToBase64(onePicture),
              { folder: offersFolder.path }
            );
            arrayOfPicturesUrl.push(onePictureToSave.secure_url);
          }

          newOffer.product_pictures = arrayOfPicturesUrl;
        }
      }

      console.log("Saving Offer ...");

      await newOffer.save();

      //inclure les infos de l'utilisateur dans newOffer
      //await newOffer.populate("owner", "account _id");

      //Cette methode a été abandonnée car nous n'avons plus besoin d'appeler à la main les clés de user que l'on souhaite
      //car nous l'avons déjà fait avec select dans isAuthenticated
      // res.status(200).json({
      //   _id: newOffer._id,
      //   product_name: newOffer.product_name,
      //   product_description: newOffer.product_description,
      //   product_price: newOffer.product_price,
      //   product_details: newOffer.product_details,
      //   owner: {
      //     account: req.user.account,
      //     _id: req.user._id,
      //   },
      //   product_image: newOffer.product_image,
      // });

      res.status(200).json(newOffer);
    } catch (error) {
      console.log("Inside catch");
      res.status(500).json({ message: error.message });
    }
  }
);

//Update an offer (PUT)
router.put("/offer/:id", fileUpload(), isAuthenticated, async (req, res) => {
  try {
    //recuperer l'offer en base

    const offer = await Offer.findById(req.params.id).populate("owner");
    //si pas d'offre ==> e,nvoi d'erreur
    if (!offer) {
      return res.status(400).json({ error: "Offer doesn't exist!" });
    }
    //si non on continue le script
    const { title, description, price, condition, city, brand, size, color } =
      req.body;
    // on recupere les nouvelles infos des modifications
    console.log(title);
    if (title) {
      offer.product_name = title;
    }
    if (description) {
      offer.product_description = description;
    }
    if (price) {
      offer.product_price = price;
    }
    if (condition) {
      offer.product_details[2].ETAT = condition;
    }
    if (city) {
      offer.product_details[4].EMPLACEMENT = city;
    }
    if (brand) {
      offer.product_details[0].MARQUE = brand;
    }
    if (size) {
      offer.product_details[1].TAILLE = size;
    }
    if (color) {
      offer.product_details[3].COULEUR = color;
    }
    if (req.files.picture) {
      //Tranformation de l'image en string avant save sur cloudinary
      const pictureToUpload = req.files.picture;
      const transformedPicture = convertToBase64(pictureToUpload);
      //console.log(pictureToUpload);

      //J'enregistre dans cloudinary mon image

      const offersFolder = "/vinted/offers/" + offer._id;
      // const offersFolder = await cloudinary.api.sub_folders(
      //   "/vinted/offers/" + offer._id
      // );
      console.log(offersFolder);

      const pictureToSave = await cloudinary.uploader.upload(
        transformedPicture,
        { folder: offersFolder }
      );

      offer.product_image = pictureToSave;
    }
    //on sauvegarde en base
    await offer.save();
    res
      .status(200)
      .json({ message: `the offer "${offer.product_name}" has been updated!` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Delete an OFFER (DELETE)
router.delete("/offer/:id", isAuthenticated, async (req, res) => {
  //recuperer l'offer en base et je delete

  const offer = await Offer.findById(req.params.id);
  //si pas d'offre ==> e,nvoi d'erreur
  if (!offer) {
    return res.status(400).json({ error: "Offer doesn't exist!" });
  }
  //si non on continue le script
  const offersFolder = "/vinted/offers/" + offer._id;
  console.log(offer.product_image.public_id);

  await cloudinary.uploader.destroy(offer.product_image.public_id, {
    folder: offersFolder,
  });
  await cloudinary.api.delete_folder(offersFolder);

  await Offer.deleteOne({ _id: req.params.id });
  res
    .status(200)
    .json({ message: `the offer "${offer.product_name}" has been delete!` });
});

//GET OFFERS WITH FILTERS
router.get("/offers", async (req, res) => {
  console.log("Before try");
  try {
    console.log("Inside try");

    const { title, priceMin, priceMax, sort, page } = req.query;

    //Toute la logique pour filtrer la requete est faite dans la fonction utilitaire `../utils/filterOffer.js`
    const offers = await filterOffer(title, priceMin, priceMax, sort, page);
    console.log("Returning Offers ARRAY ...");

    // notre offers sera toujours limité à 5 mais il faut donner la totalité des offres disponibles
    // il faut utiliser la methode countDocument()
    const offersLength = await Offer.countDocuments();
    console.log(offers.length);
    if (offers.length === 0) {
      res.status(200).json({ message: "Aucune offre n'a été trouvée!" });
    } else {
      res.status(200).json({
        count: offersLength,
        offers: offers,
      });
    }
  } catch (error) {
    console.log("Inside catch");
    res.status(500).json({ message: error.message });
  }
});

//GET ONE OFFER BY ID
router.get("/offers/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account _id"
    );
    if (offer === null) {
      return res.status(400).json({
        message: "No existing offer!",
      });
    }
    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
