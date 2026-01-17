"use client";

import { LinkButton } from "@/components/ui/LinkButton";
import { contactFormSchema, ContactFormValues } from "@/lib/schemas";
import { HelpCircle, ShieldCheck, Send } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { toast } from "sonner";
import { submitContactForm } from "@/app/actions/contact";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactClient() {
  const [isPending, startTransition] = useTransition();

  // 1. Setup the form hook
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      email: "",
      subject: "",
      message: "",
    },
  });

  // 2. Define the submit handler
  function onSubmit(data: ContactFormValues) {
    startTransition(async () => {
      const result = await submitContactForm(data);

      if (result.success) {
        toast.success("Message sent!", {
          description: "We'll get back to you shortly.",
        });
        form.reset();
      } else {
        toast.error("Error", { description: result.error });
      }
    });
  }
  return (
    <main className='bg-[#fbfbf8]'>
      {/* HERO */}
      <section className='mx-auto max-w-7xl px-6 pt-16 md:pt-24 pb-10 lg:pl-24'>
        <div className='max-w-3xl'>
          <div className='inline-flex items-center rounded-full bg-[#eaf3ee] px-4 py-2 text-xs font-semibold text-[#0b4726] border border-[#0b4726]/10'>
            Contact
          </div>

          <h1 className='mt-6 font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#0b4726] leading-tight'>
            We&apos;re here to help —{" "}
            <span className='italic text-amber-500'>without friction</span>.
          </h1>

          <p className='mt-5 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
            Most questions are answered in our FAQ. If you still need help, want
            to report an issue, or have a partnership inquiry, send us a message
            below.
          </p>
        </div>
      </section>

      {/* FAQ + FORM */}
      <section className='mx-auto max-w-7xl px-6 py-10 md:py-14 lg:pl-24'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* FAQ */}
          <div className='rounded-3xl border border-[#0b4726]/10 bg-white px-7 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]'>
            <div className='flex items-start gap-3'>
              <div className='h-11 w-11 rounded-2xl bg-[#0b4726]/10 text-[#0b4726] grid place-items-center border border-[#0b4726]/10'>
                <HelpCircle className='h-5 w-5' />
              </div>
              <div>
                <h2 className='font-serif text-xl font-semibold text-[#0a2e1c]'>
                  Check the FAQ first
                </h2>
                <p className='mt-2 text-sm text-[#5f7f6f] leading-relaxed'>
                  Common questions about recommendation links, faculty access,
                  security, pricing, and workflows are answered there.
                </p>

                <div className='mt-5'>
                  <LinkButton href='/faq' variant='green' size='md'>
                    Go to FAQ →
                  </LinkButton>
                </div>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className='rounded-3xl border border-[#0b4726]/10 bg-white px-7 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]'>
            <div className='flex items-start gap-3 mb-6'>
              <div className='h-11 w-11 rounded-2xl bg-[#0b4726]/10 text-[#0b4726] grid place-items-center border border-[#0b4726]/10'>
                <Send className='h-5 w-5' />
              </div>
              <div>
                <h2 className='font-serif text-xl font-semibold text-[#0a2e1c]'>
                  Send us a message
                </h2>
                <p className='mt-1 text-sm text-[#5f7f6f]'>
                  We usually respond within 1-2 business days.
                </p>
              </div>
            </div>

            {/* <form className='space-y-4'>
              <input
                type='text'
                placeholder='Name (optional)'
                className='w-full rounded-xl border border-[#0b4726]/15 px-4 py-2 text-sm'
              />

              <input
                type='email'
                required
                placeholder='Email'
                className='w-full rounded-xl border border-[#0b4726]/15 px-4 py-2 text-sm'
              />

              <textarea
                rows={4}
                required
                placeholder='Message'
                className='w-full rounded-xl border border-[#0b4726]/15 px-4 py-2 text-sm'
              />

              <button
                type='submit'
                className='rounded-xl bg-[#0b4726] px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition'
              >
                Send message
              </button>

              <p className='text-xs text-[#0b4726]/60'>
                Please don&apos;t include recommendation letter content or
                sensitive personal data. By submitting this form, you agree to
                our{" "}
                <a
                  href='/privacy'
                  className='underline hover:opacity-80 transition'
                >
                  Privacy Policy
                </a>
                .
              </p>
            </form> */}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          className='w-full rounded-xl border border-[#0b4726]/15 px-4 py-2 text-sm'
                          placeholder=''
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subject Field */}
                <FormField
                  control={form.control}
                  name='subject'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          className='w-full rounded-xl border border-[#0b4726]/15 px-4 py-2 text-sm'
                          placeholder=''
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Message Field */}
                <FormField
                  control={form.control}
                  name='message'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          className='w-full rounded-xl border border-[#0b4726]/15 px-4 py-2 text-sm min-h-[120px]'
                          placeholder='Message content...'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type='submit'
                  disabled={isPending}
                  className='rounded-xl bg-[#0b4726] px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition w-1/2'
                >
                  {isPending ? "Sending..." : "Send Message"}
                </Button>

                <p className='text-xs text-[#0b4726]/60'>
                  Please don&apos;t include recommendation letter content or
                  sensitive personal data. By submitting this form, you agree to
                  our{" "}
                  <a
                    href='/privacy'
                    className='underline hover:opacity-80 transition'
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </form>
            </Form>
          </div>
        </div>
      </section>

      {/* SECURITY NOTE */}
      <section className='mx-auto max-w-7xl px-6 pb-16 md:pb-24 lg:pl-24'>
        <div className='rounded-3xl border border-[#0b4726]/10 bg-white px-7 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]'>
          <div className='flex items-start gap-3'>
            <div className='h-11 w-11 rounded-2xl bg-[#0b4726]/10 text-[#0b4726] grid place-items-center border border-[#0b4726]/10'>
              <ShieldCheck className='h-5 w-5' />
            </div>
            <div>
              <h2 className='font-serif text-xl font-semibold text-[#0a2e1c]'>
                Privacy & security note
              </h2>
              <p className='mt-2 text-sm text-[#5f7f6f]'>
                We never ask for recommendation letters or confidential
                materials through this form.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
