"use server";
import { Resend } from "resend";
import { contactFormSchema, ContactFormValues } from "@/lib/schemas";
import { EmailTemplate } from "@/components/contact-email-templates";

//! This code can be used if we want to have a moderation dashboard that stores messages in the database
// export async function submitContactForm(data: ContactFormValues) {
//   const result = contactFormSchema.safeParse(data);

//   if (!result.success) {
//     return { success: false, error: "Invalid data provided" };
//   }

//   try {
//     const supabase = createClient();
//     await supabase.from('messages').insert(result.data);

//     console.log("Server received:", result.data);

//     return { success: true, message: "Message sent successfully!" };
//   } catch (error) {
//     return { success: false, error: "Something went wrong." };
//   }
// }

//! We will need to set up a Resend account and get an API key for this to work

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitContactForm(data: ContactFormValues) {
  const result = contactFormSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: "Invalid data provided" };
  }

  const { email, subject, message } = result.data;

  try {
    const data = await resend.emails.send({
      from: "ReadMyStudent Contact <onboarding@resend.dev>", // Use your verified domain in prod
      to: process.env.STAFF_EMAIL as string,
      replyTo: email,
      subject: `[ReadMyStudent Support] ${subject}`,
      text: `
        New message from: ${email}
        
        Subject: ${subject}
        
        Message:
        ${message}
      `,
      react: EmailTemplate({ email, subject, message }),
    });

    if (data.error) {
      return { success: false, error: "Failed to send email." };
    }

    return { success: true, message: "Message sent successfully!" };
  } catch (error) {
    return { success: false, error: "Something went wrong." };
  }
}
