import { EmailInfo, getUpcomingBooks } from "@/app/lib/data";
import { dateFormat, Shelf, ShelfPriority } from "@/app/lib/helper";
import dayjs from "dayjs";
import { Resend } from "resend";

export const dynamic = "force-dynamic" // Prevents caching so the function runs every time

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
    // Get the user agent to verify it's coming from Vercel Cron
    const userAgent = request.headers.get("user-agent") || ""
    const isVercelCron = userAgent.includes("vercel-cron")

    // Log information about the cron job execution
    console.log(`Cron job executed at ${new Date().toISOString()}`)
    console.log(`Triggered by Vercel Cron: ${isVercelCron}`)

    // Perform your scheduled task here
    // For example: update database, send notifications, etc.
    const results = await getUpcomingBooks();
    const emailData = new Map<string, EmailInfo[]>();
    results.forEach(
        (row) => {
            const emails = emailData.get(row.email) || [];
            emails.push(row);
            emailData.set(row.email, emails);
        }
    )



    await Promise.all(
        Array.from(emailData.entries()).map(
            (data) => {
                const [email, emailInfoArray] = data;
                resend.emails.send({
                    from: 'Gooderreads <onboarding@resend.dev>',
                    to: [email],
                    subject: "You have ARCs releasing in a week!",
                    html: `
                        <div>
                            <h3>Hi, ${emailInfoArray?.[0]?.name}!</h3>
                            <p>These books are publishing within a week!</p>
                            <ul>
                                ${emailInfoArray?.sort(todoSort).map((val) => `
                                    <li>
                                        <bold>${shelfLabel[val.shelf](val.reviewdone)}</bold>
                                        ${val.title} by ${val.author} publishing on ${dayjs(val.releasedate).format(dateFormat)}
                                    </li>`).join('')}
                            </ul>
                        </div>
                    `,
                });
            }
        )
    );

    // You can add your business logic here
    const data = {
        executedAt: new Date().toISOString(),
        message: "Cron job executed successfully",
        isVercelCron,
    }

    return Response.json(data);
}

const todoSort = (a: EmailInfo, b: EmailInfo) => {
    if (a.shelf === b.shelf) {
        if(a.shelf === Shelf.READ && a.reviewdone) {
            return -1;
        }

        return a.releasedate.valueOf() - b.releasedate.valueOf();
    } 

    return ShelfPriority[a.shelf] - ShelfPriority[b.shelf];
}

const shelfLabel = {
    [Shelf.TBR]: () => "Need to read:",
    [Shelf.READING]: () => "Need to finish:",
    [Shelf.READ]: (reviewdone: boolean) => reviewdone ? "All done:" : "Need to review:",
    [Shelf.DNF]: ()=> "You DNFd:",
}
