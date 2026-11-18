/**
 * DELETE /api/extension/token
 *
 * Disconnect: deletes the extension's token, so a copy of it stops working.
 * The token is issued by the connect page (src/app/(auth)/extension/connect).
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { bearerToken, revokeExtensionToken } from "@/lib/extension-auth";

export async function DELETE(req: Request) {
  const token = bearerToken(req);
  if (token) await revokeExtensionToken(adminDb(), token);
  return new NextResponse(null, { status: 204 });
}
