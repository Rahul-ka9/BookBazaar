const addBookLink = document.getElementById('add-book-link');

addBookLink.addEventListener('click', (event) => {

    fetch('/books/checkAuthentication')
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            // Handle the error response
            return response.json().then(data => Promise.reject(data));
        }
    })
    .then(data => {
        window.location.href = '/add_book';
    })
    .catch(error => {
        // Handle the error and show an alert
        event.preventDefault();
        alert('You must be logged in to sell your books.');
        // alert(error.error);
    });

});
