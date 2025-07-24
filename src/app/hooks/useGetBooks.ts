import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { BookData, getAllBooks } from "../lib/data";
import dayjs from "dayjs";
import { dateFormat, Shelf, Todo } from "../lib/helper";


export const useGetBooks = () => {
    const { userId } = useAuth();
    const { user } = useUser();
    const { data, isLoading, isError } = useQuery({
        queryKey: ["allBooks", userId],
        queryFn: () => {
            const recent = (new Date().valueOf() - (user?.createdAt as Date).valueOf()) < 60000;
            return getAllBooks(
                userId as string,
                recent ? (user?.fullName as string) : undefined,
                recent ? (user?.primaryEmailAddress?.emailAddress as string) : undefined
            ).then(
                (allBooks) => {
                    return allBooks.map(
                        (book) => {
                            book.releasedate = dayjs(book.releasedate).format(dateFormat);
                            if (book.sources && book.sources?.indexOf("arc") > -1 && !book.arcreviewed) {
                                console.log("in sources")
                                const overdueBook = isOverdue(book.releasedate as string);
                                if (book.arcoptional) {
                                    book.todo = Todo.Optional;
                                } else if (book.shelf === Shelf.READ) {
                                    book.todo = overdueBook ? Todo.OverdueToReview : Todo.UpcomingToReview;
                                } else if (book.shelf === Shelf.READING || book.shelf === Shelf.TBR) {
                                    book.todo = overdueBook ? Todo.OverdueToRead : Todo.UpcomingToRead;
                                }
                            } else {
                                book.todo = Todo.None;
                            }

                            return book;
                        }
                    ) as BookData[];
                }
            );
        },
        enabled: !!userId && !!user,
    });

    return { data, isLoading, isError };
}

const twoWeeksAgo = dayjs().subtract(2, 'week');
const isOverdue = (releaseDate: string | Date) => {
    if (dayjs(releaseDate).isBefore(twoWeeksAgo)) {
        return true;
    }

    return false;
}
