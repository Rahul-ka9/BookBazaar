const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const MongoDBStore = require('connect-mongodb-session')(session);
const port = process.env.PORT || 3000;
const ejs = require('ejs');
const path = require('path');
const Book = require('./models/Book');
const socketIO = require('socket.io');
const http = require('http');
// const server = http.createServer(app);
// const WebSocket = require('ws');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const formatMessage = require("./utils/chatMessage");
const mongoClient = require("mongodb").MongoClient;
const dbname = "Bookstore1";
const chatCollection = "chats";
const userCollection = "onlineUsers";
const server = http.createServer(app);
const io = socketIO(server);
const database = "mongodb://127.0.0.1:27017/";
const Rating = require("./models/Ratings");
const User = require('./models/User')

// Database connection setup
mongoose.connect('mongodb://127.0.0.1:27017/Bookstore1', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error('MongoDB connection error', err);
});

// Middleware setup
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json())


// Set up body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Create a new MongoDB session store
const store = new MongoDBStore({
    uri: 'mongodb://127.0.0.1:27017/SessionStore', // MongoDB URI for session storage
    collection: 'sessions',
});

// Catch errors in the session store
store.on('error', (error) => {
    console.error('Session store error:', error);
});

// Configure session middleware
app.use(session({
    secret: 'konr fuuw tfla pmoj', // Change this to a secret key for session encryption
    resave: false,
    saveUninitialized: false,
    store: store,
}));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.get('/index', (req, res) => {
    res.render('index'); // Render the index.ejs file
});


// Import the auth router
const authRouter = require('./routes/auth');
const bookRoutes = require('./routes/books');

// Use the authRouter for dashboard and login routes
app.use('/auth', authRouter);
app.use('/books', bookRoutes);
// let showDropdown;

let showDropdown = false;

app.get("/", async (req, res) => {
  const user = req.session.user;
  try {
    let books;
    let ratings;

    // Fetch books from the database
    if (user) {
      books = await Book.find({}).exec();
      showDropdown = true;
    } else {
      books = await Book.find({}).exec();
      showDropdown = false;
    }

    ratings = await Rating.find({}).exec();

    res.render("index", { user, books, ratings, showDropdown });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// app.get('/', (req, res) => {
//     const user = req.session.user;
//     let ratings;
//     if (user) {
//         Book.find({})
//             .exec()
//             .then(books => {
//                 showDropdown = true;
//                 res.render('index', { user, books, showDropdown });
//             })
//             .catch(err => {
//                 console.error('Error:', err);
//                 res.status(500).json({ success: false, message: 'Internal server error' });
//             });
//     } else {
//         Book.find({})
//             .exec()
//             .then(books => {
//                 showDropdown = false;
//                 res.render('index', { user, books, showDropdown });
//             })
//             .catch(err => {
//                 console.error('Error:', err);
//                 res.status(500).json({ success: false, message: 'Internal server error' });
//             });
//     }
// });

app.get('/add_book', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add_book.html'));
});

app.get('/get-user', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.json({ user: null });
    }
});

app.get("/get-logged-in-user-id", (req, res) => {
    // Check if the user is logged in
    if (req.session.user && req.session.user._id) {
      res.json({ userId: req.session.user._id }); // Send the user ID in the response
    } else {
      res.status(401).json({ error: "User not logged in" }); // Send an error if the user is not logged in
    }
  });

app.get('/bookDetails', async (req, res) => {
    const bookId = req.query.id; // Get the book ID from the query parameter
    const user = req.session.user;
    try {
        const book = await Book.findById(bookId); 
        if (book) {
            res.render('bookDetails', { book, showDropdown, user });
        } else {
            // res.status(404).send('Book not found');
            res.status(404).send(`
        <p>Book not found</p>
        <script>
            setTimeout(function(){
                window.location.href = '/';
            }, 2000); // Redirects after 5 seconds
        </script>
    `);

        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Add this route to handle search requests
app.get('/search', async (req, res) => {
    const user = req.session.user;
    const query = req.query.q;
    try {
        const results = await Book.find({
            $or: [
                { title: { $regex: new RegExp(query, 'i') } },
                { author: { $regex: new RegExp(query, 'i') } },
            ],
        });
        res.render('searchResults', { results, query, showDropdown, user }); // Pass results to the view
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/admin', async (req, res) => {
    try {
        // Check if the admin session exists
        if (req.session && req.session.admin) {
            // Fetch total number of users
            const totalUsers = await User.countDocuments();
            const totalBooks = await Book.countDocuments();
            // If the session exists, render the admin page with total users count
            res.render('admin', { totalUsers, totalBooks });
        } else {
            // If the session does not exist, redirect the user to the login page
            res.redirect('/');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/userprofile', (req, res) => {
    const userId = req.session.user._id; // Assuming you store user ID in the session

    // Fetch user details from the database
    User.findById(userId)
        // const user = await User.findById(id)
        .then(user => {
            if (user) {
                res.render('userprofile', { user });
            } else {
                res.status(404).send('User not found');
            }
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/reset-password', (req, res) => {
    // Render the password reset form
    res.render('reset-password');
});

app.post('/reset-password', async (req, res) => {
    const userId = req.session.user._id; // Assuming you store user ID in the session
    const newPassword = req.body.newPassword;

    try {
        // Fetch user from the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        user.password = hashedPassword;
        await user.save();

        // Respond to the client
        res.status(200).send('Password reset successful!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/allBooks', async (req, res) => {
    try {
        const books = await Book.find(); 
        if (books.length > 0) { // Check if books array is not empty
            res.status(200).json({ books: books }); // Send books as JSON with status code 200
        } else {
            res.status(404).send('No books found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/favorites', async (req, res) => {
    try {
        // Retrieve the user's favorites from the database
        const userId = req.session.user._id;
        const user = await User.findById(userId).populate('favorites');
        const favorites = user.favorites;

        // Render the favorites page (favorites.ejs) with the favorites data
        res.render('favorites', { favorites: favorites, showDropdown, user });
    } catch (error) {
        // Handle errors
        console.error('Error fetching favorites:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.get('/categories', async (req, res) => {
  const user = req.session.user;
    try {
        // Query MongoDB to find all distinct categories
        const categories = await Book.distinct('category').exec();

        // Group books by category
        const groupedBooks = {};
        for (const category of categories) {
            groupedBooks[category] = await Book.find({ category: category }).exec();
        }

        // Render the categories.ejs template and pass groupedBooks to it
        res.render('categories', { groupedBooks, showDropdown,user});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/books/owner/:bookId", async (req, res) => {
    const bookId = req.params.bookId;
    try {
      // Fetch book details from MongoDB
      const book = await Book.findById(bookId).exec();
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      const owner = {
        name: book.user,
      };
      res.json({ owner });
    } catch (error) {
      console.error("Error fetching owner details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

app.get("/user-rating-review", async (req, res) => {
    try {
      const userId = req.session.user ? req.session.user._id : null; // Check if user is defined
      const bookId = req.query.bookId;
      if (!userId) {
        return res.json({ rating: null, review: null });
      }
      const ratingReview = await Rating.findOne({
        userId: userId,
        bookId: bookId,
      }).select("rating review");
      res.json({
        rating: ratingReview ? ratingReview.rating : null,
        review: ratingReview ? ratingReview.review : null,
      });
    } catch (error) {
      console.error("Error fetching user rating and review:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

// Update the submit-rating-review endpoint to handle cases where user is not logged in
app.post("/submit-rating-review", async (req, res) => {
    try {
      const userId = req.session.user ? req.session.user._id : null; // Check if user is defined
      if (!userId) {
        return res.status(401).json({ error: "User not logged in" }); // Send a 401 Unauthorized status if user is not logged in
      }
      const { bookId, rating, review, bookimg, name } = req.body;
      const existingRatingReview = await Rating.findOne({
        userId: userId,
        bookId: bookId,
      });
      if (existingRatingReview) {
        return res
          .status(400)
          .json({ error: "You have already rated and reviewed this book" });
      }
      const newRatingReview = new Rating({
        userId: userId,
        bookId: bookId,
        rating: rating,
        review: review,
        bookimg: bookimg,
        username: name,
      });
      await newRatingReview.save();
      res.status(200).json({
        success: true,
        message: "Rating and review submitted successfully",
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Function to handle MongoDB connection
  function connectToMongo(callback) {
    mongoClient.connect(database, (err, client) => {
      if (err) {
        console.error("Failed to connect to MongoDB:", err);
        return;
      }
      const db = client.db(dbname);
      const onlineUsers = db.collection(userCollection);
      const chat = db.collection(chatCollection);
      callback(client, db, onlineUsers, chat);
    });
  }
  
  io.on("connection", (socket) => {
    // console.log("New User Logged In with ID " + socket.id);
    // console.log("here33");
    socket.on("chatMessage", async (data) => {
      // console.log("here34");
      const dataElement = formatMessage(data);
      // console.log(dataElement);
      // console.log(data.toUser);
      connectToMongo((client, db, onlineUsers, chat) => {
        chat.insertOne(dataElement, (err, res) => {
          if (err) {
            console.error("Failed to insert message into database:", err);
            client.close();
            return;
          }
          socket.emit("message", dataElement);
          // console.log(data.toUser);
          // console.log(onlineUsers);
          // const ele = onlineUsers.findOne({ name: data.toUser });
          // console.log("ELE");
          // console.log(ele);
          onlineUsers.findOne({ name: data.toUser }, (err, res) => {
            // console.log("ressss", res);
            if (err) {
              console.error("Failed to find online user:", err);
              client.close();
              return;
            }
            if (res != null) {
              // console.log(res);
              // location.reload();
              socket.to(res.ID).emit("message", dataElement);
              // location.reload();
            }
          });
          // client.close();
        });
      });
    });
  
    socket.on("userDetails", async (data) => {
      connectToMongo((client, db, onlineUsers, currentCollection) => {
        // const id = data.bookId;
        const onlineUser = {
          ID: socket.id,
          name: data.fromUser,
        };
        onlineUsers.insertOne(onlineUser, (err, res) => {
          if (err) {
            console.error("Failed to insert online user:", err);
            client.close();
            return;
          }
          console.log(onlineUser.name + " is online...");
          currentCollection
            .find(
              {
                // from: { $in: [data.fromUser, data.toUser] },
                // to: { $in: [data.fromUser, data.toUser] },
                bookId: { $in: [data.bookId, data.bookId] },
              },
              { projection: { _id: 0 } }
            )
            .toArray((err, res) => {
              if (err) {
                console.error("Failed to find chat history:", err);
                client.close();
                return;
              }
              socket.emit("output", res);
              client.close();
            });
        });
      });
    });
  
    //   const userID = socket.id;
    //   socket.on("disconnect", () => {
    //     connectToMongo((client, db, onlineUsers) => {
    //       const myquery = { ID: userID };
    //       onlineUsers.deleteOne(myquery, (err, res) => {
    //         if (err) {
    //           console.error("Failed to delete offline user:", err);
    //           client.close();
    //           return;
    //         }
    //         // console.log("User " + userID + " went offline...");
    //         client.close();
    //       });
    //     });
    //   });
  });

// Start the server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

