"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  fetchUserCards,
  fetchRandomCardsByCategory,
  handleAddCard,
  fetchScryfallImage,
  fetchCardTypes, // Nouvelle fonction pour récupérer les types de cartes
} from "@/app/services/strapiServices";
import StackedCards from "@/app/components/StackedCards";

// Composant pour l'affichage des cartes avec un bouton "Ajouter"
function CardGrid({ cards, flipped, onFlipCard, session, onCardAdded }) {
  const handleAddCardToDeck = async (card) => {
    await handleAddCard(session, card);
    onCardAdded(card); // Appeler la fonction pour mettre à jour les stacked cards
  };

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`card ${flipped[index] ? "flipped" : ""}`}
          onClick={() => onFlipCard(index)}
          style={{
            perspective: "1000px",
            cursor: "pointer",
            width: "200px",
            height: "280px",
          }}
        >
          <div
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: flipped[index] ? "rotateY(180deg)" : "",
              width: "100%",
              height: "100%",
              position: "relative",
            }}
          >
            <Image
              src="/card-back.jpg"
              alt="Card Back"
              width={200}
              height={280}
              style={{
                backfaceVisibility: "hidden",
                position: "absolute",
                top: 0,
                left: 0,
                transform: "rotateY(180deg)",
              }}
            />
            <Image
              className="hover:scale-110"
              src={card.image_uris?.normal}
              alt={card.name}
              width={200}
              height={280}
              style={{
                backfaceVisibility: "hidden",
              }}
            />
          </div>
          {!flipped[index] && session && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Empêche le clic de retourner la carte
                handleAddCardToDeck(card);
              }}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ajouter au deck
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// Composant pour les contrôles (nombre de cartes, catégorie et tirage)
function CardControls({ numCards, onNumCardsChange, onDrawCards, cardTypes, onCategoryChange }) {
  return (
    <div className="mb-8 flex flex-col items-center">
      {/* Sélecteur pour la catégorie */}
      <select onChange={(e) => onCategoryChange(e.target.value)} className="mySelect mb-4 p-2 border rounded">
        <option value="">-- Sélectionner une catégorie --</option>
        {cardTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <input
        type="number"
        min="1"
        value={numCards}
        onChange={(e) => onNumCardsChange(parseInt(e.target.value))}
        className="mySelect mb-4 p-2 border rounded"
        placeholder="Nombre de cartes"
      />
      <button
        onClick={onDrawCards}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        RETIREZ {numCards} CARTES
      </button>
    </div>
  );
}

// Composant principal Home (Créer Deck)
export default function Home() {
  const [userCards, setUserCards] = useState([]);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [numCards, setNumCards] = useState(5); // Nombre de cartes à tirer
  const [loading, setLoading] = useState(false);
  const [cardTypes, setCardTypes] = useState([]); // Liste des types de cartes
  const [selectedCategory, setSelectedCategory] = useState(""); // Catégorie sélectionnée
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      const fetchCardsWithImages = async () => {
        const userCardsData = await fetchUserCards(session);
        const cardsWithImages = await Promise.all(
          userCardsData.map(async (userCard) => {
            const cardAttributes = userCard.attributes.card.data.attributes;
            const cardId = cardAttributes.cardId;
            const imageUrl = await fetchScryfallImage(cardId);
            return {
              ...userCard,
              imageUrl,
              cardName: cardAttributes.name,
            };
          })
        );
        setUserCards(cardsWithImages);
      };

      // Récupérer les types de cartes depuis l'API Scryfall
      const fetchTypes = async () => {
        const types = await fetchCardTypes();
        setCardTypes(types);
      };

      fetchCardsWithImages();
      fetchTypes();
    }
  }, [session]);

  // Fonction pour mettre à jour les cartes empilées après l'ajout d'une nouvelle carte
  const handleCardAdded = async (newCard) => {
    const cardId = newCard.id;
    const imageUrl = await fetchScryfallImage(cardId);
    const updatedUserCards = [
      ...userCards,
      { cardName: newCard.name, imageUrl },
    ];
    setUserCards(updatedUserCards);
  };

  const handleNumCardsChange = (value) => {
    if (!isNaN(value) && value > 0) {
      setNumCards(value);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleFlipCard = (index) => {
    const newFlipped = [...flipped];
    newFlipped[index] = !newFlipped[index];
    setFlipped(newFlipped);
  };

  const handleDrawCards = async () => {
    setLoading(true);
    const newCards = await fetchRandomCardsByCategory(numCards, selectedCategory); // Tirer des cartes selon la catégorie sélectionnée
    setCards([...cards, ...newCards]); // Ajouter les nouvelles cartes aux anciennes
    setFlipped([...flipped, ...Array(numCards).fill(true)]); // Réinitialiser l'état de retournement pour les nouvelles cartes
    setLoading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-24">
      {/* Affichage des cartes empilées */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Mes Cartes</h2>
        <StackedCards cards={userCards} />
      </div>

      {/* Contrôles pour tirer des cartes */}
      <CardControls
        numCards={numCards}
        onNumCardsChange={handleNumCardsChange}
        onDrawCards={handleDrawCards}
        cardTypes={cardTypes} // Passez les types de cartes au composant
        onCategoryChange={handleCategoryChange} // Passez la fonction pour mettre à jour la catégorie
      />

      {/* Affichage des cartes tirées */}
      {loading ? (
        <div className="spinner">Loading...</div>
      ) : (
        <CardGrid
          cards={cards}
          flipped={flipped}
          onFlipCard={handleFlipCard}
          session={session}
          onCardAdded={handleCardAdded} // Passez la fonction pour mettre à jour les stacked cards
        />
      )}
    </main>
  );
}
