const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/convertToBase64");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const router = express.Router();

//Je convert le buffer du req.files.picture en base64 pour le stocker sur cloudinary
// const convertToBase64 = (file) => {
//   return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
// };

//Sign Up creat new User
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    //Destructuring ==> on destructure un Objet et j'assigne la valeur de chaque clé à chaque variable créée dans les accolades
    const { username, email, password, newsletter } = req.body;

    //si username et email ne sont pas données pas l'utilisateur
    //Il faudrait "sanitize" tout ce qui est envoyé par l'utilisateur !! ==> package `dompurify`
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    //on check si le mail d'inscription existe déjà dans la base
    const existingUser = await User.findOne({ email: email });
    //si username existe en base
    if (existingUser !== null) {
      //409 status qui signale un conflit entre les data comparées
      return res.status(409).json({ message: "This email already exists!" });
    }

    //On génère un salt avec 16 caractères
    const salt = uid2(16);

    // o hash le paswword + le salt
    const hash = SHA256(password + salt).toString(encBase64);

    //on crée un token
    const token = uid2(64);

    // console.log(req.body);
    // console.log("salt => ", salt);
    // console.log("hash => ", hash);

    //je crée une instance de User
    const newUser = new User({
      email,
      account: {
        username,
      },
      newsletter,
      token,
      hash,
      salt,
    });

    //Gestion de l'image AVATAR
    if (req.files?.avatar) {
      const pictureToUpload = req.files.avatar;
      const transformedPicture = convertToBase64(pictureToUpload);

      // //Creation d'un folder pour stocker un avatar par utilisateur
      const userFolder = await cloudinary.api.create_folder(
        `/vinted/users/${newUser._id}`
      );
      console.log(userFolder);
      const pictureToSave = await cloudinary.uploader.upload(
        transformedPicture,
        {
          folder: userFolder.path,
        }
      );

      // //on assigne l'image à l'avatar de l'utilisateur
      newUser.account.avatar = pictureToSave;
    }

    //Save l'utilisateur en base
    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email && !password) {
      return res.status(400).json({
        massage: "email and password are required!",
      });
    }
    const user = await User.findOne({ email: email });

    if (user.email !== email) {
      //console.log("user not");
      return res.status(400).json({ message: "Unauthorized!" });
    }
    //Je compare le hash du user en BD avec le hash du req.body.password + user.salt
    const newHash = SHA256(password + user.salt).toString(encBase64);
    if (newHash !== user.hash) {
      //   console.log("password not");
      //   console.log("hash2 =>", hash2);
      //   console.log("hash =>", user.salt);
      //statyus 401 unauthorized
      return res.status(401).json({ message: "Unauthorized!" });
    }

    //if User is OK
    res.status(200).json({
      _id: user._id,
      token: user.token,
      account: user.account,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
