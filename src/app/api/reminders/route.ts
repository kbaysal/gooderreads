import { EmailInfo, getUpcomingBooks } from "@/app/lib/data";
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
                ${emailInfoArray?.map((val) => `<li>${val.bookid}</li>`).join('')}
            </ul>
            </div>`,
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
