const express = require('express');
const router = express.Router();
const Book = require('../models/Book'); // Import the Book model
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    // Configuration for file storage
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Store the uploaded images in the "public/uploads" directory
    },
    filename: function (req, file, cb) {
        // cb(null, Date.now() + '-' + file.originalname); // Generate unique file names
        const uniqueFilename = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueFilename);
        // Save the unique filename to the request object so it can be accessed in the route handler
        req.uniqueFilename = uniqueFilename;
    }
});

const upload = multer({ storage: storage });

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        // User is authenticated
        return next();
    } else {
        // User is not authenticated, display an alert message
        return res.status(401).json({ error: 'You must be logged in to access this feature.' });
    }
}


router.get('/checkAuthentication', isAuthenticated, (req, res) => {
    // If the user is authenticated, return a JSON response
    res.json({ isAuthenticated: true });
});

// Route to add a book
router.post('/addbook', isAuthenticated, upload.single('image'), async (req, res) => {
    // Book addition logic
    const userEmail=req.session.user.email;
    try {
        // Extract book data from the request body and file
        const { title, author, publication_year, description, price, publisher, language, quantity, category, condition } = req.body;
        const user = req.session.user.name;
        const userphn = req.session.user.phone;
        const filename = `/uploads/${req.uniqueFilename}`;

        // Call the Python script to process the image
        const python = spawn('python', ['./script.py', filename]);
        let processedImage;
        python.stdout.on('data', (data) => {
            processedImage = data.toString();
        });
        
        // Wait for the Python script to finish
        python.on('close', async (code) => {
            if (code !== 0) {
                console.error('Python script exited with code', code);
                return res.status(500).json({ success: false, message: 'Internal server error.' });
            }

            // Create a new book object (assuming you have a schema and model for books in your database)
            const newBook = new Book({
                user,
                title,
                author,
                publication_year,
                description,
                price,
                publisher,
                language,
                image: filename, // Save the path to the processed image in the database
                userEmail,
                quantity,
                category,
                condition,
                userphn
            });

            // Save the book to the database
            await newBook.save();

            res.status(200).json({ success: true, message: 'Book added to the database.' });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Route to get all book details
router.get('/Books', async (req, res) => {
    try {
        const books = await Book.find(); 
        // console.log(books);
        if (books) {
            res.render('products', {loading: false, products: books });
        } else {
            res.status(404).send('No books found');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

router.post('/upload-profile-pic', isAuthenticated, upload.single('profilePic'), async (req, res) => {
    try {
        // Find the user and update their profilePic field
        const updatedUser = await User.findOneAndUpdate(
            { email: req.session.user.email },
            { profilePic: '/uploads/' + req.file.filename },
            { new: true }  // This option returns the updated document
        );

        if (!updatedUser) {
            return res.status(404).send('User not found');
        }

        // res.send('Success: File Uploaded!');
        res.redirect('/userprofile');
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while uploading the file.');
    }
});

// Route to delete a book
router.get('/deletebook/:id', async (req, res) => {
    try {
        // Find the book by its ID and delete it
        const book = await Book.findByIdAndDelete(req.params.id);
        
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found.' });
        }

        // Remove the associated image file from the uploads folder
        const imagePath = path.join(__dirname, '..', 'public', book.image);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Error deleting image:', err);
            }
        });

        res.json({ success: true, message: 'Book deleted successfully.' });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Route to render the update form
router.get('/products/:id/update', async (req, res) => {
    try {
        const product = await Book.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        // Render your update form here
        res.render('updateForm', { product });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Route to handle the update submission
router.post('/:id/update', async (req, res) => {
    try {
        const { title, author, publication_year, publisher, language, category, description, price, quantity } = req.body;
        await Book.findByIdAndUpdate(req.params.id, {
            title,
            author,
            publication_year,
            publisher,
            language,
            category,
            description,
            price,
            quantity
        });     
        res.redirect('back');
        // res.redirect('/admin'); // Redirect to the products page or any other appropriate page
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Endpoint to add a book to favorites
router.post('/addtofavorites', isAuthenticated, async (req, res) => {
    try {
        //console.log(req.body);
        // Extract book ID from request body
        const { bookId } = req.body;
       
        // Get the user ID from the logged-in user (assuming user object is stored in session)
        const userId = req.session.user._id;
        // console.log("user is" + userId);
         
        // Find the user by ID
        const user = await User.findById(userId);
        
  
        // Check if the book ID is already in the favorites array
        if (!user.favorites.includes(bookId)) {
            // If not, add the book ID to the favorites array
            user.favorites.push(bookId);

            // Save the updated user document
            await user.save();

            // Send a success response
            res.status(200).json({ message: 'Book added to favorites successfully.' });
        } else {
            // If the book ID is already in favorites, send a message indicating it's already added
            res.status(400).json({ message: 'Book already exists in favorites.' });
        }
    } catch (error) {
        // Handle errors
        console.error('Error adding book to favorites:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Assuming you've defined your Express app as 'app'
router.post('/removeFromFavorites', (req, res) => {
    const userId = req.session.user._id; // Assuming you have access to the user ID
    const bookId = req.query.id; // Assuming the book ID is passed as a query parameter

    // Find the user by ID
    User.findById(userId)
        .then(user => {
            // Check if the user exists
            if (!user) {
                return res.status(404).send('User not found.');
            }

            // Check if the provided bookId is in the user's favorite book IDs array
            const index = user.favorites.indexOf(bookId);
            if (index !== -1) {
                // Book found in favorites, remove it from the array
                user.favorites.splice(index, 1);
                return user.save(); // Return the promise for chaining
            } else {
                console.log(`Book with ID ${bookId} is not in favorites of user ${userId}.`);
                return Promise.reject('Book not found in favorites.'); // Reject the promise
            }
        })
        .then(() => {
            res.redirect('back');
        
        })
        .catch(err => {
            console.error('Error removing book from favorites:', err);
            res.status(500).send('Error removing book from favorites.'); // Send a 500 response if an error occurs
        });
});

module.exports = router;
