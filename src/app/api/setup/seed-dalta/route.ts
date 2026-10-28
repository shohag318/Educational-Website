import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST() {
  try {
    const scriptPath = path.resolve(process.cwd(), "scripts/seed-dalta-sample.js");
    await new Promise((resolve, reject) => {
      exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error("Seed Dalta error:", error, stderr);
          return reject(error);
        }
        resolve(stdout);
      });
    });

    return NextResponse.json({
      success: true,
      message: "Dalta Degree College PDF sample data seeded successfully!",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
