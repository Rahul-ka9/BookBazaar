function addToFavorites(bookId) {
    fetch('/books/addtofavorites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookId: bookId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add book to favorites');
        }
        return response.json();
    })
    .then(data => {
        // console.log('Book added to favorites:', data);
        alert("Book added to favorites");
    })
    .catch(error => {
        console.error('Error adding book to favorites:', error);
    });
}


function redirectToFavorites() {
    // Fetch code to check if the user is logged in
    fetch('/auth/checkLoginStatus')
        .then(response => {
            if (response.ok) {
                // User is logged in, redirect to favorites
                window.location.href = "/favorites";
            } else {
                // User is not logged in, show alert
                alert("Please log in to view favorites.");
            }
        })
        .catch(error => {
            console.error('Error checking login status:', error);
            // Handle error if unable to check login status
            alert('Failed to check login status. Please try again later.');
        });
}