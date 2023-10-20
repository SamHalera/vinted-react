const Offer = require("../models/Offer");

//Filtrer les offres en fonction des paramatres donnés en query
const filterOffer = (title, priceMin, priceMax, sort, page) => {
  //ObjToFind recoit title, priceMin et priceMax
  const objToFind = {};

  //ObjToSort recoit sort
  const objToSort = {};

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

  //4 offres par page
  const valueToLimit = 4;

  //si page est dans le query
  //par defaut la page à donner à sort et 1
  let pageToSend = 1;
  if (page && page !== "0") {
    pageToSend = page;
  }
  // Je calcule skip en fonction du query page que j'ai reçu
  valueToSkip = (pageToSend - 1) * 4; // 4 * pageToSend -4

  //Methode avant la correction --> ci-dessous
  // if (page) {
  //   //SI page est 0
  //   if (page === "0") {
  //     valueToSkip = 0;
  //     valueToLimit = 0;
  //   } else {
  //     //trie les pages 4 offres par page
  //     const nbParPage = 4;
  //     //skip peut être calculé aussi = (n°page -1) * nbParPage
  //     valueToSkip = page * nbParPage - nbParPage;
  //     valueToLimit = nbParPage;
  //   }
  // }

  //si sort est dans le query
  if (sort) {
    if (sort !== "price-asc" && sort !== "price-desc") {
      objToSort.product_price = "asc";
    } else {
      const sortQuery = sort.replace("price-", "");
      objToSort.product_price = sortQuery;
    }
  }

  //requete mongoose avec des valeurs par defaut si jamais notre query est vide
  const offers = Offer.find(objToFind)
    .sort(objToSort)
    .skip(valueToSkip)
    .limit(valueToLimit);

  return offers;
};

module.exports = filterOffer;
