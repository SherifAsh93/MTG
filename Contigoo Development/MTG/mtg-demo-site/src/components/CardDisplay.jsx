import { useState, useEffect } from "react";
import {
  getCardByName,
  getCardImageUrl,
  getCardName,
  getCardTypeLine,
  getCardManaCost,
  getCardOracleText,
  isDoubleFacedCard,
} from "../services/mtgService";

const CardDisplay = () => {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSearch, setLastSearch] = useState("");

  // Fetch a random card when component mounts
  useEffect(() => {
    const loadRandomCard = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedCard = await getRandomCard();
        setCard(fetchedCard);
        setLastSearch(fetchedCard.name);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRandomCard();
  }, []);

  // Fetch card by name when searchTerm changes (but not on initial mount)
  useEffect(() => {
    if (searchTerm && searchTerm !== lastSearch) {
      const fetchCardByName = async () => {
        try {
          setLoading(true);
          setError(null);
          const fetchedCard = await getCardByName(searchTerm);
          setCard(fetchedCard);
          setLastSearch(searchTerm);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchCardByName();
    }
  }, [searchTerm, lastSearch]);

  // Reset card when search is cleared - initialize state directly instead of in effect
  // Card state is managed by the search effects above

  if (loading) {
    return (
      <div className="loading-spinner">
        <span>Loading MTG card...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>Error fetching card: {error}</p>
        <button
          onClick={() => setSearchTerm("")}
          style={{ marginTop: "0.5rem" }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!card) {
    return <div>No card found</div>;
  }

  const imageUrl = getCardImageUrl(card);
  const manaCost = getCardManaCost(card);
  const typeLine = getCardTypeLine(card);
  const oracleText = getCardOracleText(card);
  const cardNameDisplay = getCardName(card);
  const isDoubleFaced = isDoubleFacedCard(card);

  return (
    <div className="card-container">
      <div style="marginBottom: 20px; textAlign: center;">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter card name..."
          style="padding: 8px; fontSize: 14px; width: 200px;"
        />
        <button
          onClick={() => setSearchTerm(searchTerm || cardNameDisplay)}
          style="marginLeft: 10px; padding: 8px 16px; fontSize: 14px;"
        >
          Search
        </button>
      </div>
      {isDoubleFaced && (
        <div className="card-double-faced">
          {card.card_faces.map((face, index) => (
            <div key={index} className="card-face">
              <img
                src={face.image_uris?.normal || face.image_uris?.large}
                alt={face.name}
                className="card-image"
              />
              <div className="card-info">
                <h3>{face.name}</h3>
                <p>{face.mana_cost || "—"}</p>
                <p>{face.type_line || "—"}</p>
                <p>{face.oracle_text?.substring(0, 100)}...</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isDoubleFaced && (
        <div className="card-face">
          <img src={imageUrl} alt={cardNameDisplay} className="card-image" />
          <div className="card-info">
            <h3>{cardNameDisplay}</h3>
            <p>{manaCost || "—"}</p>
            <p>{typeLine || "—"}</p>
            <p>{oracleText?.substring(0, 150)}...</p>
          </div>
        </div>
      )}

      <div className="card-actions">
        <button onClick={() => setCard(null)} className="btn-new-card">
          Get Another Card
        </button>
        <button
          onClick={() => setSearchTerm(cardNameDisplay)}
          className="btn-search"
        >
          Search by Name
        </button>
      </div>
    </div>
  );
};

export default CardDisplay;
