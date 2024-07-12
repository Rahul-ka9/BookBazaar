const express = require('express');
const router = express.Router();
const Book = require('./models/book'); // Import your Book model

// Route to render the page with book details based on category
router.get('/', async (req, res) => {
    try {
        // Query MongoDB to find all distinct categories
        const categories = await Book.distinct('category').exec();

        // Group books by category
        const groupedBooks = {};
        for (const category of categories) {
            groupedBooks[category] = await Book.find({ category: category }).exec();
        }

        res.render('books', { groupedBooks }); // Pass the grouped books to the EJS template
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;