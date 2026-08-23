import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "invalid_json",
          message: "Request body must be valid JSON.",
          hint: "Send a JSON object with your form fields as the request body.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxPtGgPIgkMkfeGz3Qip5qqAqyH0fn_6XnUyzj7qjKALYtN9B2-VZcWhO3tqRAD4i2ybg/exec",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "upstream_error",
            message: "The form submission service returned an error.",
            hint: "Try again shortly, or email hello@homzrealtor.com directly.",
          },
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "upstream_unreachable",
          message: "Could not reach the form submission service.",
          hint: "Try again shortly, or email hello@homzrealtor.com directly.",
        },
      },
      { status: 502 }
    );
  }
}
