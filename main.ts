import { serveDir } from "https://deno.land/std@0.171.0/http/file_server.ts";

const USER_FILE = "./users.json";

async function loadUsers() {
  try {
    const data = await Deno.readTextFile(USER_FILE);
    return JSON.parse(data);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return [];
    }
    throw err;
  }
}

async function saveUsers(users: any) {
  const data = JSON.stringify(users, null, 2);
  await Deno.writeTextFile(USER_FILE, data);
}

const users = await loadUsers();


Deno.serve(async (req) => {
  const { pathname } = new URL(req.url);
  if (req.method === "PUT" && pathname.startsWith("/edit-user")) {
    const url = new URL(req.url);
    const index = parseInt(url.searchParams.get("index") || "0");
  
    if (!isNaN(index) && index >= 0 && index < users.length) {
      const body = await req.json();
      const { name, age } = body;
  
      if (name && age) {
        users[index].name = name;
        users[index].age = age;
  
        await saveUsers(users);
  
        return new Response(JSON.stringify({ message: "User updated" }), {
          headers: { "Content-Type": "application/json" },
        });
      }
  
      return new Response(JSON.stringify({ message: "Invalid data" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }
  
    return new Response(JSON.stringify({ message: "Invalid index" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }

  if (req.method === "DELETE" && pathname.startsWith("/delete-user")) {
    const url = new URL(req.url);
    const index = parseInt(url.searchParams.get("index") || "0");

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

  if (req.method === "POST" && pathname === "/add-user") {
    const formData = await req.formData();
    const name = formData.get("name");
    const age = formData.get("age");
    const profilePic = formData.get("profilePic");
  
    let profilePicPath = "";
    if (profilePic) {
      const fileName = `${Date.now()}-${(profilePic as File).name}`;
      profilePicPath = `/uploads/${fileName}`;
      await Deno.writeFile(`./public${profilePicPath}`, new Uint8Array(await (profilePic as File).arrayBuffer()));
    }
  
    users.push({ name, age, profilePic: profilePicPath });
    await saveUsers(users);
  
    return new Response(JSON.stringify({ message: "User added" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  

  if (pathname === "/list-users") {
    return new Response(JSON.stringify(users), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return serveDir(req, {
    fsRoot: "public",
    showIndex: true,
  });
});
