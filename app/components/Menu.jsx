"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Menu() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = () => {
    signOut({
      redirect: false,
      callbackUrl: "/login",
    });
  };

  console.log(session)

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-800 text-white p-4 z-50">
      <ul className="flex space-x-4">
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
    </nav>
  );
}
