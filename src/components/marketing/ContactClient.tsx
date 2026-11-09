"use client";

import Link from "next/link";
import { contactFormSchema, ContactFormValues } from "@/lib/schemas";
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
    <section className='px-5 pb-20 pt-8 md:px-8 md:pb-28 lg:pt-16'>
      <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-12'>
        <div className='lg:col-span-5'>
          <h1 className='font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-7xl'>
            Talk to <span className='text-gold'>a person.</span>
          </h1>
          <p className='mt-6 max-w-md text-lg leading-relaxed text-flap-ink/90'>
            Most questions are answered in the{" "}
            <Link href='/faq' className='text-flap-ink underline'>
              FAQ
            </Link>
            . If yours is not, or you want to report a problem, write to us here.
          </p>
          <p className='mt-4 max-w-md text-base text-flap-dim'>
            We never ask for recommendation letters or confidential materials through this form.
          </p>
        </div>

        <div className='sheet px-6 py-8 md:px-10 md:py-10 lg:col-span-7'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Email Field */}
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='caption text-ink-2'>Email</FormLabel>
                    <FormControl>
                      <Input placeholder='' {...field} />
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
                    <FormLabel className='caption text-ink-2'>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder='' {...field} />
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
                    <FormLabel className='caption text-ink-2'>Message</FormLabel>
                    <FormControl>
                      <Textarea className='min-h-[140px]' placeholder='Message content...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' disabled={isPending} className='w-full sm:w-auto'>
                {isPending ? "Sending..." : "Send Message"}
              </Button>

              <p className='border-t border-dashed border-rule pt-4 text-sm text-ink-2'>
                Please do not include recommendation letter content or sensitive personal data. By submitting this form, you agree to our{" "}
                <a href='/privacy' className='text-forest underline'>
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
