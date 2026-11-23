/** @jest-environment node */

import nodemailer from "nodemailer";
import { Resend } from "resend";
import { sendEmail } from "@/lib/email";

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

jest.mock("resend", () => ({
  Resend: jest.fn(),
}));

const smtpSend = jest.fn();
const resendSend = jest.fn();

const message = {
  from: "ReadMyStudent <notification@readmystudent.com>",
  to: "faculty@test.local",
  subject: "Local test",
  html: "<p>Test</p>",
};

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.EMAIL_TRANSPORT;
  process.env.RESEND_API_KEY = "test-key";

  jest.resetAllMocks();

  (nodemailer.createTransport as jest.Mock).mockReturnValue({
    sendMail: smtpSend,
  });
  (Resend as unknown as jest.Mock).mockImplementation(() => ({
    emails: { send: resendSend },
  }));
});

afterEach(() => {
  process.env = { ...originalEnv };
});

test("uses Resend by default", async () => {
  resendSend.mockResolvedValue({ data: { id: "resend-id" }, error: null });

  await expect(sendEmail(message)).resolves.toEqual({
    data: { id: "resend-id" },
    error: null,
  });
  expect(Resend).toHaveBeenCalledWith("test-key");
  expect(resendSend).toHaveBeenCalledWith(message);
  expect(nodemailer.createTransport).not.toHaveBeenCalled();
});

test("uses Mailpit in local mode", async () => {
  process.env.EMAIL_TRANSPORT = "local";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  smtpSend.mockResolvedValue({ messageId: "local-id" });

  await expect(sendEmail(message)).resolves.toEqual({
    data: { id: "local-id" },
    error: null,
  });
  expect(nodemailer.createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ host: "127.0.0.1", port: 54325 }),
  );
  expect(smtpSend).toHaveBeenCalledWith(message);
  expect(Resend).not.toHaveBeenCalled();
});

test("rejects local mode with hosted Supabase", async () => {
  process.env.EMAIL_TRANSPORT = "local";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

  const result = await sendEmail(message);

  expect(result.error?.message).toBe("Local email requires local Supabase.");
  expect(nodemailer.createTransport).not.toHaveBeenCalled();
  expect(Resend).not.toHaveBeenCalled();
});

test("returns SMTP failures as errors", async () => {
  process.env.EMAIL_TRANSPORT = "local";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  smtpSend.mockRejectedValue(new Error("SMTP unavailable"));

  await expect(sendEmail(message)).resolves.toEqual({
    data: null,
    error: { message: "SMTP unavailable" },
  });
});

test("preserves errors returned by Resend", async () => {
  const response = {
    data: null,
    error: { message: "Invalid API key", name: "validation_error" },
  };
  resendSend.mockResolvedValue(response);

  await expect(sendEmail(message)).resolves.toEqual(response);
});
