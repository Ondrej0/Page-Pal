// Define the Book class with an index
class Book {
    constructor(title, author, year, genre, index, isRead = false) {
        this.title = title;
        this.author = author;
        this.year = year;
        this.genre = genre;
        this.index = index; // Index to maintain original order
        this.cover = ''; // Initially empty; will be updated from the API
        this.isRead = isRead;
    }
}

// Array to store the library
let library = [];

// Function to add books to the library
function addBook(book) {
    library.push(book);
    fetchCoverImage(book).then(coverUrl => {
        book.cover = coverUrl;
        appendBook(book); // Append the new book to the DOM after fetching cover
    });
}

// Function to append a single book to the list
function appendBook(book) {
    const bookList = document.getElementById('bookList');

    // Check if book is already present to avoid duplicates
    const existingBook = document.querySelector(`div[data-index="${book.index}"]`);
    if (existingBook) {
        return; // Book is already in the list
    }

    const bookItem = document.createElement('div');
    bookItem.style.display = 'flex';
    bookItem.style.alignItems = 'center';
    bookItem.style.marginBottom = '20px';
    bookItem.dataset.index = book.index;

    const coverImg = document.createElement('img');
    coverImg.src = book.cover || 'https://via.placeholder.com/100';
    coverImg.alt = `${book.title} cover`;
    coverImg.style.maxWidth = '100px';
    coverImg.style.marginRight = '15px';

    const textContent = document.createElement('div');
    textContent.textContent = `${book.title} by ${book.author}, published in ${book.year}. Genre: ${book.genre}`;

    const readCheckbox = document.createElement('input');
    readCheckbox.type = 'checkbox';
    readCheckbox.checked = book.isRead;
    readCheckbox.style.marginLeft = '15px';
    readCheckbox.addEventListener('change', () => toggleReadStatus(book.index, readCheckbox.checked));

    const readLabel = document.createElement('label');
    readLabel.textContent = book.isRead ? "Read" : "Not Read";
    readLabel.style.marginLeft = '5px';

    readCheckbox.addEventListener('change', () => {
        readLabel.textContent = readCheckbox.checked ? "Read" : "Not Read";
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add("deleteBtn");
    deleteBtn.style.marginLeft = '10px';
    deleteBtn.addEventListener('click', () => deleteBook(book.index));

    bookItem.appendChild(coverImg);
    bookItem.appendChild(textContent);
    bookItem.appendChild(readCheckbox);
    bookItem.appendChild(readLabel);
    bookItem.appendChild(deleteBtn);

    bookList.appendChild(bookItem);
}

// Function to list books on the page
async function listBooks(filteredBooks = library) {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = ''; // Clear current list

    try {
        // Fetch cover images for books that need it
        const updatedBooks = await Promise.all(filteredBooks.map(async (book) => {
            if (!book.cover) { // Only fetch if cover is not already set
                const coverUrl = await fetchCoverImage(book);
                book.cover = coverUrl;
            }
            return book;
        }));

        // Sort books by their original index
        updatedBooks.sort((a, b) => a.index - b.index);

        // Append each book to the list
        updatedBooks.forEach(book => appendBook(book));
    } catch (error) {
        console.error('Error listing books:', error);
    }
}

// Fetch the cover image URL from Google Books API
async function fetchCoverImage(book) {
    const query = encodeURIComponent(`${book.title} ${book.author}`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=AIzaSyA6bgsxYVBeRQSYI3ElxMYnQueXw_ovseY`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const coverUrl = data.items[0].volumeInfo.imageLinks ? data.items[0].volumeInfo.imageLinks.thumbnail : '';
            return coverUrl;
        } else {
            return ''; // No cover available
        }
    } catch (error) {
        console.error('Error fetching cover image:', error);
        return ''; // Fallback if there's an error
    }
}

// Handle file upload
document.getElementById('fileInput').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        rows.forEach((row, index) => {
            const book = new Book(
                row.Title,
                row.Author,
                parseInt(row.Year),
                row.Genre,
                library.length,
                row.isRead.toString().toLowerCase() === 'true'
            );
            addBook(book);
        });

        // Update the display
        listBooks();
    };

    reader.readAsArrayBuffer(file);
}

// Adding book manually with Button
const inputDiv = document.getElementById("inputDiv");
const inputTitle = document.getElementById("titleInput");
const inputAuthor = document.getElementById("authorInput");
const inputYear = document.getElementById("yearInput");
const inputGenre = document.getElementById("genreInput");
const inputRead = document.getElementById("readInput");
const addBookBtn = document.getElementById("addBookBtn");

addBookBtn.addEventListener("click", async () => {
    if (inputTitle.value === "" || inputAuthor.value === "" || inputYear.value === "" || inputGenre.value === "") {
        alert("Fill in all fields");
        return;
    }

    const isRead = inputRead.checked;

    const book = new Book(
        inputTitle.value,
        inputAuthor.value,
        parseInt(inputYear.value),
        inputGenre.value,
        library.length,
        isRead
    );
    addBook(book);

    inputTitle.value = "";
    inputAuthor.value = "";
    inputYear.value = "";
    inputGenre.value = "";
    inputRead.checked = false;
});

// Toggle read status function
function toggleReadStatus(index, isRead) {
    library[index].isRead = isRead;

    // Update the read status label directly
    const bookItem = document.querySelector(`div[data-index="${index}"]`);
    const readLabel = bookItem.querySelector('label');
    readLabel.textContent = isRead ? "Read" : "Not Read";
}

// Delete book function
function deleteBook(index) {
    library = library.filter((book, i) => i !== index);

    const bookItem = document.querySelector(`div[data-index="${index}"]`);
    if (bookItem) {
        bookItem.remove();
    }

    library.forEach((book, i) => {
        book.index = i;
        const item = document.querySelector(`div[data-index="${i}"]`);
        if (item) {
            item.dataset.index = i;
        }
    });
}

// Search function
document.getElementById('search').addEventListener('click', () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    const filteredBooks = library.filter(book => {
        return (
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.year.toString().includes(searchTerm) ||
            book.genre.toLowerCase().includes(searchTerm) ||
            (book.isRead ? "read" : "not read").toLowerCase().includes(searchTerm)
        );
    });

    // Display the filtered books
    listBooks(filteredBooks);
});


// Search function
document.getElementById('search').addEventListener('click', () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    const filteredBooks = library.filter(book => {
        return (
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.year.toString().includes(searchTerm) ||
            book.genre.toLowerCase().includes(searchTerm) ||
            (book.isRead ? "read" : "not read").toLowerCase().includes(searchTerm)
        );
    });

    // Display the filtered books
    listBooks(filteredBooks);
});

//Toggle hidden class ------------------------------------------------------------------

const optionsSection = document.getElementById("optionsSection");
const inputDivContainer = document.getElementById("inputDivContainer");
const bookListContainer = document.getElementById("bookListContainer");


function toggleHidden(){
    optionsSection.classList.toggle("hidden");
    inputDivContainer.classList.toggle("hidden");
    bookListContainer.classList.toggle("hidden");

    inputTitle.value = "";
    inputAuthor.value = "";
    inputYear.value = "";
    inputGenre.value = "";
    inputRead.checked = false;
}




// Test code for the api
const apiKey = 'AIzaSyA6bgsxYVBeRQSYI3ElxMYnQueXw_ovseY'; 

function searchBookCover() {
    const query = document.getElementById('searcInput').value;
    if (!query) {
        alert('Please enter a search query.');
        return;
    }

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => displayCover(data))
        .catch(error => console.error('Error:', error));
}

function displayCover(data) {
    const coverImage = document.getElementById('coverImage');

    if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        coverImage.src = book.imageLinks ? book.imageLinks.thumbnail : 'https://via.placeholder.com/200';
        coverImage.alt = book.title ? `${book.title} cover` : 'Book Cover';
        console.log(book)
    } else {
        coverImage.src = 'https://via.placeholder.com/200';
        coverImage.alt = 'No cover available';
    }
}
