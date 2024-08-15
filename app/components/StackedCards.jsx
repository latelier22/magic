"use client";
import Image from "next/image";
import { useState } from "react";

function StackedCards({ cards }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const cardWidth = 200; // Largeur d'une carte
  const offset = 30; // Décalage entre les cartes

  const totalWidth = cardWidth + (cards.length - 1) * offset; // Largeur totale de l'empilement

  return (
    <div className="relative py-48" style={{ width: `${totalWidth}px` }}> {/* Largeur ajustée */}
      {cards.map((card, index) => (
        <div
          key={card.id}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          className={`absolute top-0 transition-transform transform ${
            hoveredIndex === index ? "scale-125 z-50" : ""
          }`}
          style={{
            zIndex: hoveredIndex === index ? 100 : index, // La carte survolée passe au-dessus
            left: `calc(50% - ${totalWidth / 2}px + ${index * offset}px)`, // Centrage à partir du milieu
            transform: hoveredIndex === index
              ? `translateY(-20px) scale(1.25)` // Légèrement décalé vers le haut lorsqu'elle est survolée
              : `translateY(0)`,
          }}
        >
          <Image
            src={card.imageUrl || "/placeholder.png"}
            alt={card.name}
            width={200}
            height={280}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export default StackedCards;
