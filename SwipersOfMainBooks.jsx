import axios from "axios";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar } from "swiper/modules";
import "swiper/css"; // basic Swiper styles
import "swiper/css/navigation"; // if you plan to use navigation
import "swiper/css/pagination"; // if you plan to use pagination
import "swiper/css/scrollbar"; // if you plan to use scrollbar
import "swiper/css/autoplay";
import ROUTES from "../../routes/ROUTES";
import { useNavigate } from "react-router-dom";
import "../../components/CardsComponent.css";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { Typography } from "@mui/material";
import "./SwipersOfMainBooks.css";
import cart2 from "../../images/cart2.png";
const SwipersOfMainBooks = () => {
  const [booksByCategory, setBooksByCategory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [visable, setVisable] = useState({});
  const [isHover, setIsHover] = useState({});
  const [isFav, setIsFav] = useState({});
  const queries = [
    "Graphic Novels",
    "history",
    "action superpower",
    "fantasy",
    "Historical Fiction",
    "Literary Fiction",
    "Cookbooks",
    "Health & Fitness",
  ];

  useEffect(() => {
    const fetchBooksForAllCategories = async () => {
      setIsLoading(true);
      let categories = {};

      for (const query of queries) {
        try {
          const response = await axios.get(`/api/books`, {
            params: { q: query },
          });
          if (response.data && response.data.items) {
            const processedBooks = processBooks(response.data.items);
            categories[query] = processedBooks;
          }
        } catch (error) {
          console.error("Fetching books failed for query:", query, error);
          categories[query] = [];
        }
      }

      setBooksByCategory(categories);
      setIsLoading(false);
    };

    fetchBooksForAllCategories();
  }, []);
  const processBooks = (books) => {
    const seenBooks = new Set();
    return books
      .map((book) => {
        if (book.volumeInfo?.pageCount && book.volumeInfo.pageCount < 150) {
          book.hasDiscount = true;
        } else {
          book.hasDiscount = false;
        }
        return book;
      })
      .filter((book) => {
        const bookKey =
          book.volumeInfo?.title +
          "-" +
          (book.volumeInfo.authors?.join(",") || "");
        if (!seenBooks.has(bookKey) && book.volumeInfo?.imageLinks?.thumbnail) {
          seenBooks.add(bookKey);
          return true;
        }
        return false;
      });
  };

  const handleClickCard = (id) => {
    navigate(`${ROUTES.BOOKSDETAIL}/${id}`);
  };

  const handleFavClick = (e, bookId) => {
    e.stopPropagation();
    setIsFav((prevFavorites) => {
      const updatedFavorites = {
        ...prevFavorites,
        [bookId]: !prevFavorites[bookId], // Toggle the favorite status
      };
      console.log("Updated Favorites:", updatedFavorites); // Debugging output
      return updatedFavorites;
    });
  };

  return (
    <>
      {Object.entries(booksByCategory).map(([category, books]) => (
        <div
          key={category}
          id={category.replace(" ", "-").toLowerCase()}
          className={`oneRowOfSlider ${visable[category] ? "visible" : ""}`}
          onMouseEnter={() =>
            setVisable((visable) => ({ ...visable, [category]: true }))
          }
        >
          <h2>{category}</h2>
          <Swiper
            modules={[Navigation, Pagination, Scrollbar]}
            slidesPerView={5}
            spaceBetween={1}
            navigation
          >
            {books.map((book) => {
              const cleanAuthors = book.volumeInfo.authors
                ? book.volumeInfo.authors.join(" ").split(" ", 4).join(" ")
                : "No authors listed";
              return (
                <SwiperSlide
                  key={book.id}
                  onClick={() => handleClickCard(book.id)}
                >
                  <div
                    className="image-zoom-container"
                    style={{
                      textAlign: "center",
                      width: "90%",
                      position: "relative",
                    }}
                  >
                    {book.hasDiscount && (
                      <Typography
                        sx={{
                          bgcolor: "red",
                          color: "white",
                          borderBottomRightRadius: "50px",
                          borderTopRightRadius: "50px",
                          position: "absolute",
                          top: "1.65vw", // Adjust based on viewport width
                          left: "3.1vw", // Adjust based on viewport width
                          fontSize: "1vw", // Make font size responsive
                          padding: "0.3vw",
                          width: "50%",
                          height: "4%",
                          zIndex: 2,
                        }}
                      >
                        20% off
                      </Typography>
                    )}
                    <div style={{ position: "relative" }}>
                      <img
                        src={book.volumeInfo.imageLinks.thumbnail}
                        alt={book.volumeInfo.title}
                        style={{
                          width: "11.5vw",
                          height: "35vh",
                          margin: "25px auto",
                          boxShadow: "0 8px 15px rgb(0,0,0,0.2)",
                        }}
                        onMouseEnter={() =>
                          setIsHover({ ...isHover, [book.id]: true })
                        }
                        onMouseLeave={() =>
                          setIsHover({ ...isHover, [book.id]: false })
                        }
                      />
                      <div className="foggy-cover" style={{ zIndex: 3 }}></div>

                      <FavoriteIcon
                        className="favIcon"
                        style={{
                          zIndex: 4,
                          height: 50,
                          color: isFav[book.id] ? "red" : "black",
                        }}
                        onClick={(e) => handleFavClick(e, book.id)}
                      />
                      <img
                        className="cartIcon"
                        src={cart2}
                        alt="cart"
                        height={25}
                        width={35}
                      ></img>
                    </div>
                    <h3>{book.volumeInfo.title}</h3>
                    <p>{cleanAuthors}</p>
                  </div>
                </SwiperSlide>
              );
            })}
            <hr style={{ width: "90%" }} />
          </Swiper>
        </div>
      ))}
    </>
  );
};

export default SwipersOfMainBooks;
