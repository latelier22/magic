// app/services/strapiServices.js

// Fonction pour récupérer les cartes associées à l'utilisateur
export async function fetchUserCards(session) {
    const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    const response = await fetch(
      `${apiUrl}/api/user-cards?populate=card&filters[user][id][$eq]=${session.user.id}`,
      {
        headers: {
          Authorization: `Bearer ${session.jwt}`,
        },
      }
    );
  
    const data = await response.json();
    return data.data || [];
  }
  
  // Fonction pour tirer un nombre donné de cartes au hasard depuis Scryfall
  export async function fetchRandomCards(numCards) {
    const fetchedCards = [];
    for (let i = 0; i < numCards; i++) {
      const response = await fetch("https://api.scryfall.com/cards/random");
      const cardData = await response.json();
      fetchedCards.push(cardData);
    }
    return fetchedCards;
  }
  
  // Fonction pour vérifier si une carte existe dans Strapi
  async function checkCardInStrapi(cardId, token) {
    const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    const response = await fetch(
      `${apiUrl}/api/cards?filters[cardId][$eq]=${cardId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  
    const data = await response.json();
    return data.data.length > 0 ? data.data[0] : null;
  }
  
  // Fonction pour ajouter une carte à l'utilisateur dans Strapi
  export async function handleAddCard(session, card) {
    const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    const userId = session.user.id;
    const token = session.jwt;
  
    // Vérifiez si la carte existe déjà dans Strapi
    let existingCard = await checkCardInStrapi(card.id, token);
  
    if (!existingCard) {
      // Si la carte n'existe pas dans Strapi, la créer
      const createCardRes = await fetch(`${apiUrl}/api/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            name: card.name,
            cardId: card.id,
          },
        }),
      });
  
      const createdCardData = await createCardRes.json();
      existingCard = createdCardData.data;
    }
  
    // Vérifiez si la carte est déjà associée à l'utilisateur
    const existingUserCardRes = await fetch(
      `${apiUrl}/api/user-cards?populate=card&filters[user][id][$eq]=${userId}&filters[card][id][$eq]=${existingCard.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  
    const existingUserCardData = await existingUserCardRes.json();
  
    if (existingUserCardData.data.length > 0) {
      const existingUserCard = existingUserCardData.data[0];
      const updatedCount = existingUserCard.attributes.count + 1;
  
      // Mettre à jour le nombre d'exemplaires
      await fetch(`${apiUrl}/api/user-cards/${existingUserCard.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            count: updatedCount,
          },
        }),
      });
    } else {
      // Créer une nouvelle entrée pour cette carte associée à l'utilisateur
      await fetch(`${apiUrl}/api/user-cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            user: userId,
            card: existingCard.id,
            count: 1,
          },
        }),
      });
    }
  }
  
  // Fonction pour récupérer l'image d'une carte depuis Scryfall
  export async function fetchScryfallImage(cardId) {
    const response = await fetch(`https://api.scryfall.com/cards/${cardId}`);
    const data = await response.json();
    return data.image_uris?.normal || "/placeholder.png";
  }
  

  // Fonction pour tirer des cartes au hasard selon une catégorie spécifique depuis Scryfall
export async function fetchRandomCardsByCategory(numCards, category) {
    const fetchedCards = [];
    const query = category
      ? `https://api.scryfall.com/cards/search?order=cmc&q=t:${encodeURIComponent(category)}+q=lang%3Afr&unique=prints`
      : "https://api.scryfall.com/cards/random";
  
    for (let i = 0; i < numCards; i++) {
      const response = await fetch(query);
      const cardData = await response.json();
      if (cardData.data) {
        // Si c'est une recherche par catégorie, prendre une carte au hasard parmi les résultats
        const randomCard = cardData.data[Math.floor(Math.random() * cardData.data.length)];
        fetchedCards.push(randomCard);
      } else {
        fetchedCards.push(cardData);
      }
    }
    return fetchedCards;
  }

  // Fonction pour récupérer les types de cartes depuis l'API Scryfall
export async function fetchCardTypes() {
    const response = await fetch("https://api.scryfall.com/catalog/card-types");
    const data = await response.json();
    return data.data || []; // Retourne la liste des types de cartes
  }
  

  