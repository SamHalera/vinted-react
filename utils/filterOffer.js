const Offer = require("../models/Offer");

//Filtrer les offres en fonction des paramatres donnés en query
const filterOffer = (title, priceMin, priceMax, sort, page, bool) => {
  //ObjToFind recoit title, priceMin et priceMax
  const objToFind = {};

  //On verifie quel query on a et on traite la requete en base en fonction de ces query
  //SI title est dans le query
  if (title) {
    const regexp = new RegExp(title, "i");
    objToFind.product_name = regexp;
  }

  //Si priceMin ou priceMax sont dans le query
  if (priceMin && priceMax) {
    objToFind.product_price = {
      $gte: priceMin,
      $lte: priceMax,
    };
  } else if (priceMax) {
    objToFind.product_price = {
      $lte: priceMax,
    };
  } else if (priceMin) {
    objToFind.product_price = {
      $gte: priceMin,
    };
  }

  //recoit page
  let valueToSkip = 0;

  //10 offres par page
  let valueToLimit = 10;

  // if arg true (home page) we retrieve all offers with no limit
  if (bool) {
    valueToLimit = 0;
  }

  //si page est dans le query
  //par defaut la page à donner à sort et 1
  let pageToSend = 1;
  if (page && page !== "0") {
    pageToSend = page;
  }
  // Je calcule skip en fonction du query page que j'ai reçu
  valueToSkip = (pageToSend - 1) * 5; // 4 * pageToSend -4

  //ObjToSort recoit sort
  const objToSort = {};

  if (!sort || (sort !== "price-asc" && sort !== "price-desc")) {
    objToSort.product_price = "asc";
  } else {
    const sortQuery = sort.replace("price-", "");
    objToSort.product_price = sortQuery;
  }

  //requete mongoose avec des valeurs par defaut si jamais notre query est vide
  const offers = Offer.find(objToFind)
    .sort(objToSort)
    .skip(valueToSkip)
    .limit(valueToLimit)

    .populate({ path: "owner", select: "account" });

  return offers;
};

module.exports = filterOffer;
