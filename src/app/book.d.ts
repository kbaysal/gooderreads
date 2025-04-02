interface Book {
    id: string;
    saleInfo: {
        country: string;
    }
    volumeInfo: {
        authors: string[];
        averageRating: number;
        categories: string[];
        description: string;
        imageLinks: {
            smallThumbnail: string;
            thumbnail: string;
        };
        pageCount: number;
        printType: string;
        publishedDate: string;
        publisher: string;
        title: string;
    }
}

interface BookResponse {
    items: Book[];
}