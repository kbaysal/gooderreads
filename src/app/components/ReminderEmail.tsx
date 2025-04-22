import dayjs from "dayjs";
import { EmailInfo } from "../lib/data";
import { Shelf, ShelfPriority } from "../lib/helper";

export const ReminderEmail = (props: { emailBooks: EmailInfo[] }) => {
    const emailInfoArray = props.emailBooks;
    const tableData: EmailInfo[][] = [];
    emailInfoArray?.sort(todoSort).map(
        (emailInfo, index) => {
            const row = Math.floor(index / 3);
            if (index % 3 === 0) {
                tableData[row] = [];
            }

            tableData[row].push(emailInfo);
        }
    )
    return (
        <div>
            <h2 style={{ fontWeight: "normal" }}>Hi, {emailInfoArray?.[0]?.name}!</h2>
            <h3 style={{ fontWeight: "normal" }}>These books from your shelves are publishing within 2 weeks:</h3>
            <table style={{ maxWidth: 424 }}>
                <colgroup>
                    <col span={1} style={{ width: "33%" }} />
                    <col span={1} style={{ width: "33%" }} />
                    <col span={1} style={{ width: "33%" }} />
                </colgroup>
                {tableData.map(
                    (row, index) =>
                        <>
                            <tr key={index}>
                                {row.map(
                                    (book) =>
                                        <td key={book.bookid} style={{ verticalAlign: "top", padding: "0 12px 0 0" }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element*/}
                                            <img src={book.thumbnail} width="100%" alt={`Thumbnail for ${book.title}`}/>
                                        </td>
                                )}
                            </tr>
                            <tr key={index}>
                                {row.map(
                                    (book) =>
                                        <td key={book.bookid} style={{ verticalAlign: "top", padding: "4px 12px 12px 0", maxWidth: 0 }}>
                                            <div>
                                                <b>{shelfLabel[book.shelf](book.reviewdone)}</b>
                                            </div>
                                            <div style={{ color: "#9e1068", fontWeight: 600 }}>
                                                {book.title}
                                            </div>
                                            <div style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                                                {book.author}
                                            </div>
                                            <div style={{ fontSize: 10 }}>
                                                {dayjs(book.releasedate).format("MMMM D")}
                                            </div>
                                        </td>
                                )}
                            </tr>
                        </>
                )}
            </table>
        </div>
    )
}

const todoSort = (a: EmailInfo, b: EmailInfo) => {
    if (a.releasedate.valueOf() == b.releasedate.valueOf()) {
        return (
            (ShelfPriority[a.shelf] + (a.shelf === Shelf.READ && a.reviewdone ? 2 : 0)) -
            (ShelfPriority[b.shelf] + (b.shelf === Shelf.READ && b.reviewdone ? 2 : 0))
        );
    }

    return a.releasedate.valueOf() - b.releasedate.valueOf();
}

const shelfLabel = {
    [Shelf.TBR]: () => "Need to read:",
    [Shelf.READING]: () => "Need to finish:",
    [Shelf.READ]: (reviewdone: boolean) => reviewdone ? "All done:" : "Need to review:",
    [Shelf.DNF]: () => "You DNFd:",
}