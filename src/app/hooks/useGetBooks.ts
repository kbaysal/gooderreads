import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getAllBooks } from "../lib/data";


export const useGetBooks = () => {
    const { userId } = useAuth();
    const { user } = useUser();
    const { data } = useQuery({
        queryKey: ["allBooks", userId],
        queryFn: () => {
            const recent = (new Date().valueOf() - (user?.createdAt as Date).valueOf()) < 60000;
            return getAllBooks(
                userId as string,
                recent ? (user?.fullName as string) : undefined,
                recent ? (user?.primaryEmailAddress?.emailAddress as string) : undefined
            )
        },
        enabled: !!userId && !!user,
    });

    return data;
}