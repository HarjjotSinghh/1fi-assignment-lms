
import { NextResponse } from "next/server";
import { seedData } from "@/db/seed-data";

export async function GET() {
    try {
        await seedData();
        return NextResponse.json({ success: true, message: "Seed data injected successfully" });
    } catch (error) {
        console.error("Seeding failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
