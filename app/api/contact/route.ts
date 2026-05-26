import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxPtGgPIgkMkfeGz3Qip5qqAqyH0fn_6XnUyzj7qjKALYtN9B2-VZcWhO3tqRAD4i2ybg/exec",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}