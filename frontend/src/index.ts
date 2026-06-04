import { serve } from "bun";
import { readFileSync } from "fs";
import path from "path";

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.error("VITE_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("VITE_SUPABASE_PUBLISHABLE_KEY:", supabaseKey ? "✓" : "✗");
  process.exit(1);
}

// Read index.html and inject env vars
const htmlPath = path.join(import.meta.dir, "index.html");
let htmlContent = readFileSync(htmlPath, "utf-8");

// Replace environment variable placeholders
htmlContent = htmlContent
  .replace("${VITE_SUPABASE_URL}", supabaseUrl)
  .replace("${VITE_SUPABASE_PUBLISHABLE_KEY}", supabaseKey);

const server = serve({
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle TypeScript/JavaScript module imports for React app
    if (pathname.endsWith(".tsx") || pathname.endsWith(".ts")) {
      try {
        const filePath = path.join(import.meta.dir, pathname);
        const result = await Bun.build({
          entrypoints: [filePath],
          minify: false,
          format: "esm",
        });

        if (result.outputs.length > 0) {
          const code = await result.outputs[0].text();
          return new Response(code, {
            headers: { "Content-Type": "application/javascript" },
          });
        }
      } catch (err) {
        console.error(`Error bundling ${pathname}:`, err);
      }
      return new Response("Module not found", { status: 404 });
    }

    // Serve CSS files
    if (pathname.endsWith(".css")) {
      try {
        const filePath = path.join(import.meta.dir, pathname);
        const cssContent = readFileSync(filePath, "utf-8");
        return new Response(cssContent, {
          headers: { "Content-Type": "text/css" },
        });
      } catch (err) {
        return new Response("CSS not found", { status: 404 });
      }
    }

    // Serve static assets (images, etc.)
    if (pathname.includes(".svg") || pathname.includes(".png") || pathname.includes(".jpg")) {
      try {
        const filePath = path.join(import.meta.dir, pathname);
        const file = Bun.file(filePath);
        return new Response(file);
      } catch (err) {
        return new Response("Asset not found", { status: 404 });
      }
    }

    // Serve React app for all other routes (including /auth/callback, /chat, etc.)
    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html" },
    });
  },

  port: 5173,
});

console.log(`🚀 Server running at http://localhost:5173`);
console.log(`📱 React app with OAuth callback support`);

