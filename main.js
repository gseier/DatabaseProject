import { serveDir } from "https://deno.land/std@0.171.0/http/file_server.ts";

// JSON file to store users
const USER_FILE = "./users.json";

// Load existing users from the file
async function loadUsers() {
  try {
    const data = await Deno.readTextFile(USER_FILE);
    return JSON.parse(data);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      // File doesn't exist, return empty array
      return [];
    }
    throw err;
  }
}

// Save users to the file
async function saveUsers(users) {
  const data = JSON.stringify(users, null, 2);
  await Deno.writeTextFile(USER_FILE, data);
}

// Initialize users by loading from file
let users = await loadUsers();

Deno.serve(async (req) => {
  const { pathname } = new URL(req.url);

  // Delete user by index (DELETE request)
  if (req.method === "DELETE" && pathname.startsWith("/delete-user")) {
    const url = new URL(req.url);
    const index = parseInt(url.searchParams.get("index"));

    if (!isNaN(index) && index >= 0 && index < users.length) {
      users.splice(index, 1);
      await saveUsers(users);
      return new Response(JSON.stringify({ message: "User deleted" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Invalid index" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Add user (POST request)
  if (req.method === "POST" && pathname === "/add-user") {
    const body = await req.json();
    users.push(body);

    // Save the updated user list to the file
    await saveUsers(users);

    return new Response(JSON.stringify({ message: "User added", users }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // List users (GET request)
  if (pathname === "/list-users") {
    return new Response(JSON.stringify(users), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Serve static files
  return serveDir(req, {
    fsRoot: "public",
    showIndex: true,
  });
});
