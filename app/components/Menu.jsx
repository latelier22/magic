"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function Menu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut({
      redirect: false,
      callbackUrl: "/login",
    });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-800 text-white p-4 z-50">
      <div className="flex justify-between items-center">
        <div className="text-lg font-bold">
          <Link href="/">Mon Application</Link>
        </div>
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="focus:outline-none focus:ring-2 focus:ring-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              ></path>
            </svg>
          </button>
        </div>
        <ul className="hidden md:flex space-x-4">
          <li>
            <Link href="/" className="hover:underline">
              Accueil
            </Link>
          </li>
          <li>
            <Link href="/cartes" className="hover:underline">
              Toutes les cartes
            </Link>
          </li>
          <li>
            <Link href="/sets" className="hover:underline">
              Toutes les collections
            </Link>
          </li>
          <li>
            <Link href="/recherche" className="hover:underline">
              Recherche
            </Link>
          </li>
          <li>
            <Link href="/scan" className="hover:underline">
              Scanner une carte
            </Link>
          </li>
          {status === "loading" ? (
            <li>Chargement...</li>
          ) : !session ? (
            <li>
              <Link href="/login" className="hover:underline">
                Se connecter
              </Link>
            </li>
          ) : (
            <>
              <li>
                <span>Bienvenue, {session.user.name}!</span>
              </li>
              <li>
                <Link href="/mes-cartes" className="hover:underline">
                  Mes Cartes
                </Link>
              </li>
              <li>
                <Link href="/deck" className="hover:underline">
                  Mon Deck
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="hover:underline">
                  Se déconnecter
                </button>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Menu déroulant pour mobile */}
      {isMenuOpen && (
        <ul className="md:hidden mt-4 space-y-2">
          <li>
            <Link href="/" className="block hover:underline">
              Accueil
            </Link>
          </li>
          <li>
            <Link href="/cartes" className="block hover:underline">
              Toutes les cartes
            </Link>
          </li>
          <li>
            <Link href="/sets" className="block hover:underline">
              Toutes les collections
            </Link>
          </li>
          <li>
            <Link href="/recherche" className="block hover:underline">
              Recherche
            </Link>
          </li>
          <li>
            <Link href="/scan" className="block hover:underline">
              Scanner une carte
            </Link>
          </li>
          {status === "loading" ? (
            <li className="block">Chargement...</li>
          ) : !session ? (
            <li>
              <Link href="/login" className="block hover:underline">
                Se connecter
              </Link>
            </li>
          ) : (
            <>
              <li>
                <span>Bienvenue, {session.user.name}!</span>
              </li>
              <li>
                <Link href="/mes-cartes" className="block hover:underline">
                  Mes Cartes
                </Link>
              </li>
              <li>
                <Link href="/deck" className="block hover:underline">
                  Mon Deck
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left hover:underline"
                >
                  Se déconnecter
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </nav>
  );
}
