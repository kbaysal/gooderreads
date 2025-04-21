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
