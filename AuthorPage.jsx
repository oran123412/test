import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "swiper/css"; // basic Swiper styles
import "swiper/css/navigation"; // if you plan to use navigation
import "swiper/css/pagination"; // if you plan to use pagination
import "swiper/css/scrollbar"; // if you plan to use scrollbar
import "swiper/css/autoplay";
import "./AuthorPage.css";
import defaultBookImage from "../../images/defaultBookImage.jpg";
import calendar from "../../images/calendar_icon.png";
import BasicDateCalendar from "./Calendar";
import { Margin } from "@mui/icons-material";

const AuthorPage = () => {
  const { title } = useParams();
  const [activeSlide, setActiveSlide] = useState(0);
  const [hasBooksToShow, setHasBooksToShow] = useState(true);
  const [videos, setVideos] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [author, setAuthor] = useState({
    isLoading: true,
    data: {},
    error: null,
  });
  const [authorBooks, setAuthorBooks] = useState([]);

  useEffect(() => {
    const fetchAuthorBooks = async () => {
      console.log("Making API call for books with title:", title);
      try {
        const response = await axios.get(
          "https://www.googleapis.com/books/v1/volumes",
          {
            params: {
              q: `inauthor:${title}`, // Use search term from context
              orderBy: "newest",
              key: process.env.REACT_APP_GOOGLE_BOOKS_API_KEY,
            },
          }
        );

        if (response.data && response.data.items) {
          const normalize = title.toLowerCase();
          const specificAuthor = response.data.items.filter((book) =>
            book.volumeInfo.authors.some(
              (author) => author.toLowerCase() === normalize
            )
          );
          console.log("Specific author books:", specificAuthor);
          const seenBooks = new Set();
          const uniqueBooks = response.data.items.filter((book) => {
            if (book.volumeInfo && Array.isArray(book.volumeInfo.authors)) {
              // Generate a unique key for each book using title and author
              const bookKey = `${
                book.volumeInfo.title
              }-${book.volumeInfo.authors.join(",")}`;

              if (!seenBooks.has(bookKey) && specificAuthor.includes(book)) {
                seenBooks.add(bookKey);

                return true;
              }
            }

            return false;
          });

          setAuthorBooks(uniqueBooks);
          if (uniqueBooks.length > 0) {
            setHasBooksToShow(true);
          }
        } else {
          setHasBooksToShow(false);
          setAuthorBooks([]);
        }
      } catch (error) {
        console.error("Error fetching books:", error);
        setAuthorBooks([]);
      }
    };

    fetchAuthorBooks();
  }, [title]);
  useEffect(() => {
    const fetchAuthorVideos = async () => {
      console.log("Making API call for videos with title:", title);
      try {
        const response = await axios.get(
          "https://www.googleapis.com/youtube/v3/search",
          {
            params: {
              q: `${title} book review`, // Your search term
              part: "snippet", // Needed to get video details
              maxResults: 5, // Number of results to return
              type: "video", // Ensure you're only getting videos
              key: process.env.REACT_APP_YOUTUBE_API_KEY,
            },
          }
        );
        console.log(response.data);
        if (response.data && response.data.items) {
          setVideos(response.data.items);
        } else {
          setVideos([]); // Ensures videos is always an array even when no data is fetched
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
        setVideos([]);
      }
    };

    fetchAuthorVideos();
  }, [title]);

  useEffect(() => {
    const fetchAuthor = async () => {
      const baseUrl = "https://en.wikipedia.org/w/api.php";
      const authorUrl = `${baseUrl}?action=query&format=json&prop=pageimages|info|extracts&titles=${encodeURIComponent(
        title
      )}&pithumbsize=500&inprop=contentmodel|pageid&exintro=true&explaintext=true&origin=*`;

      try {
        const authorResponse = await fetch(authorUrl);
        const authorData = await authorResponse.json();

        if (!authorData.query || !authorData.query.pages) {
          throw new Error("Invalid API response: Missing author information");
        }
        const pages = authorData.query.pages;
        const authorPage = Object.values(pages)[0];

        if (authorPage.thumbnail) {
          const authorDetails = {
            title: authorPage.title,
            imageUrl: authorPage.thumbnail.source,
            summary: authorPage.extract,
          };

          setAuthor({ isLoading: false, data: authorDetails, error: null });
        } else {
          setAuthor({ isLoading: false, data: {}, error: null });
        }
      } catch (error) {
        setAuthor({ isLoading: false, data: {}, error: error.toString() });
      }
    };

    fetchAuthor();
  }, []);

  if (author.isLoading) return <div>Loading...</div>;
  if (author.error) return <div>Error loading author: {author.error}</div>;
  if (!author.data.title) return <div>No author found.</div>;

  const handleChange = (index) => {
    setActiveSlide(index);
  };
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  return (
    <>
      <img
        src={calendar}
        width={"4%"}
        height={"7%"}
        style={{
          borderRadius: "100%",
          border: "1px solid blue",
          backgroundColor: "#130EA8",
          animation: "bounce 5s infinite ease",
          cursor: "pointer",
        }}
        alt="calendar"
        onClick={toggleCalendar}
      />
      <div style={{ display: "flex", flexDirection: "row-reverse" }}>
        {showCalendar && (
          <BasicDateCalendar
            style={{
              width: "50vw",
              height: "150vh",
              position: "absolute",
              right: 0,
            }}
          />
        )}
        <div
          className="mask"
          style={{
            backgroundImage: `url(${author.data.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            width: "50%",
          }}
        >
          <div style={{ color: "white", textAlign: "center" }}>
            {author.data.title}
          </div>
          <p style={{ color: "white", textAlign: "center" }}>
            {author.data.summary}
          </p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div className="book-navigation">
          {authorBooks.map((_, index) => (
            <button
              key={index}
              className={index === activeSlide ? "active" : ""}
              onClick={() => handleChange(index)}
            ></button>
          ))}
        </div>
        <div className="book-display">
          {authorBooks.map((book, index) => (
            <div
              key={book.id}
              style={{ display: index === activeSlide ? "block" : "none" }}
            >
              <div className="slide-wrapper">
                <div
                  id="slide-role"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    flexDirection: "column",
                    alignItems: "center",
                    alignContent: "center",
                  }}
                >
                  <img
                    src={
                      book.volumeInfo.imageLinks?.thumbnail || defaultBookImage
                    }
                    alt={`Slide ${index + 1}`}
                    height={190}
                    width={125}
                  />
                  <h3 style={{ textAlign: "center", height: "84px" }}>
                    {book.volumeInfo.title.split(" ").slice(0, 5).join(" ")}
                  </h3>
                  <p>{book.volumeInfo.authors?.[0]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        {Array.isArray(videos) &&
          videos.map((video) => (
            <div key={video.id.videoId}>
              <h3>{video.snippet.title}</h3>
              <img
                src={video.snippet.thumbnails.default.url}
                alt={video.snippet.title}
                width="250"
                height="150"
              />
              <a
                href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <br />
                Watch Video
              </a>
            </div>
          ))}
      </div>
    </>
  );
};

export default AuthorPage;
