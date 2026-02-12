import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth middleware disabled — will re-enable for client handover
// import { clerkMiddleware } from "@clerk/nextjs/server";
// export default clerkMiddleware();

export default function proxy(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: [],
};
