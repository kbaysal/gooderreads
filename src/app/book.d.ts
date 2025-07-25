interface Book {
    id: string;
    saleInfo: {
        country: string;
    }
    volumeInfo: {
        authors: string[];
        description: string;
        imageLinks: {
            smallThumbnail: string;
            thumbnail: string;
        };
        pageCount: number;
        publishedDate: string;
        publishedDateOverride?: Date;
        publisher: string;
        title: string;
    }
}

interface BookResponse {
    items: Book[];
}

interface BookError {
    error: {
        code: number;
        message: string;
    }
}

interface SimplifiedBook {
    id: Book["id"];
    author: string;
    title: Book["volumeInfo"]["title"];
    thumbnail: Book["volumeInfo"]["imageLinks"]["smallThumbnail"];
    pages: Book["volumeInfo"]["pageCount"];
    publisher: Book["volumeInfo"]["publisher"];
}
