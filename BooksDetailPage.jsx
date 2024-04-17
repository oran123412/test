import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./BooksDetailPage.css";
import BooksSwiperBooksDetail from "./BooksSwiperBooksDetail";
import { IdItemContext } from "../../store/idItemContext";
import StarsRating from "./StarsRating";
import { number } from "joi";

const BooksDetailPage = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const { setCartItems } = useContext(IdItemContext);
  const { id } = useParams();

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        // Fetching detailed book info from Google Books (Changed)
        const { data: googleBooksData } = await axios.get(
          `https://www.googleapis.com/books/v1/volumes/${id}`
        );
        console.log("Google Books API response:", googleBooksData); // Log Google Books API response
        const { data: priceData } = await axios.get(
          `http://localhost:3001/books-detail/${id}`
        );
        console.log("Local API response:", priceData);
        const isDiscounted = googleBooksData.volumeInfo.pageCount < 150;
        const finalPrice = isDiscounted
          ? priceData.price * 0.8
          : priceData.price; // Changed: Calculate final price

        setSelectedCard({
          // (Changed)
          ...googleBooksData.volumeInfo,
          id: id,
          originalPrice: priceData.price,
          finalPrice: isDiscounted ? priceData.price * 0.8 : priceData.price, // Changed: Use final price here
          hasDiscount: isDiscounted,
        });
      } catch (error) {
        console.error("Error fetching book details:", error);
      }
    };

    fetchBookDetails(); // (Changed) Calling the async function to execute
  }, [id]);

  useEffect(() => {
    if (id) {
      axios
        .get(`https://www.googleapis.com/books/v1/volumes/${id}`)
        .then(({ data }) => {
          setSelectedCard(data.volumeInfo);
        })
        .catch((error) => {
          console.error("Error fetching book details:", error);
        });
    }
  }, [id]);

  if (!selectedCard) {
    return <div>Loading book details...</div>;
  }

  const formatAuthors = (authorsArray) =>
    authorsArray?.join(", ") || "Unknown Author";
  const formatISBNs = (identifiers) =>
    identifiers
      ? identifiers
          .map((identifier) => `${identifier.type}: ${identifier.identifier}`)
          .join(", ")
      : "ISBN not available";

  const handleAddToCartClick = () => {
    if (selectedCard) {
      setCartItems((prevItems) => [...prevItems, selectedCard]); // Changed: Adding the entire book detail object to the cart
    }
  };

  const currencyCode = "\u20AA";

  const cleanAndTrimDescription = (description) => {
    const cleanedDescription = selectedCard.description.replace(/<[^>]+>/g, "");
    return cleanedDescription;
  };

  const generateStarsRating = (min, max) => {
    if (!localStorage.getItem(`${id}`)) {
      const number = Math.floor(Math.random() * (max - min + 1)) + min;
      localStorage.setItem(`${id}`, JSON.stringify(number));
      return number;
    } else {
      return JSON.parse(localStorage.getItem(`${id}`));
    }
  };

  return (
    <>
      <div className="book-cover-container">
        {selectedCard.imageLinks && selectedCard.imageLinks.thumbnail && (
          <div className="bgImage-container">
            <img
              src={selectedCard.imageLinks.thumbnail}
              alt={`Cover of ${selectedCard.title}`}
              className="bgImage"
            />
          </div>
        )}
        {selectedCard.imageLinks && selectedCard.imageLinks.thumbnail && (
          <img
            src={selectedCard.imageLinks.thumbnail}
            alt={`Cover of ${selectedCard.title}`}
            className="frontImage"
          />
        )}
        <div className="cover-content">
          <h1>{selectedCard.title}</h1>
          {selectedCard.authors && (
            <p>Authors: {formatAuthors(selectedCard.authors)}</p>
          )}
          {selectedCard.publisher && <p>Publisher: {selectedCard.publisher}</p>}
          {selectedCard.publishedDate && (
            <p>Published Date: {selectedCard.publishedDate}</p>
          )}
          {selectedCard.description && (
            <p>
              Description: {cleanAndTrimDescription(selectedCard.description)}
            </p>
          )}
          {selectedCard.industryIdentifiers && (
            <div>
              ISBNs:
              <ul>
                {selectedCard.industryIdentifiers.map((identifier) => (
                  <li key={identifier.identifier}>
                    {identifier.type}: {identifier.identifier}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedCard.pageCount && (
            <p>Page Count: {selectedCard.pageCount}</p>
          )}
          {selectedCard.categories && (
            <p>Categories: {selectedCard.categories.join(", ")}</p>
          )}
          {selectedCard.averageRating && (
            <p>Average Rating: {selectedCard.averageRating}</p>
          )}
          {selectedCard.ratingsCount && (
            <p>Ratings Count: {selectedCard.ratingsCount}</p>
          )}
          {selectedCard.language && (
            <p>Language: {selectedCard.language.toUpperCase()}</p>
          )}
        </div>
      </div>
      {selectedCard.hasDiscount ? (
        <>
          <p
            style={{
              textDecoration: "line-through",
              textDecorationColor: "red",
            }}
          >
            Original Price: {currencyCode}
            {selectedCard.originalPrice}
          </p>
          <p>
            Discounted Price: {currencyCode}
            {selectedCard.finalPrice}
          </p>
        </>
      ) : (
        <p>
          Price: {currencyCode}
          {selectedCard.originalPrice}
        </p>
      )}

      <StarsRating rating={generateStarsRating(1, 5)} />
      <br />
      <br />
      <button
        onClick={handleAddToCartClick}
        style={{
          backgroundColor: "#4067A1",
          color: "white",
          width: 105,
          height: 35,
          cursor: "pointer",
        }}
      >
        add to my cart
      </button>
      <BooksSwiperBooksDetail />
    </>
  );
};

export default BooksDetailPage;
