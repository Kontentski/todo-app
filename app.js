document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = "https://mkfqpkulqicuhpawsmsk.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZnFwa3VscWljdWhwYXdzbXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY5ODA5ODksImV4cCI6MjAzMjU1Njk4OX0.J3OhpYNObgzHAliz9pQhsOzH0k-lS6cm0qFfzkqGXOg";
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  console.log("DOM fully loaded and parsed");

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      console.error("Error signing in:", error);
    }
  }

  async function fetchTasks() {
    console.log("Fetching tasks...");
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, fetching local tasks");
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      renderTasks(tasks);
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const tasks = await response.json();
        renderTasks(tasks);
      } else if (response.status === 401) {
        console.error("Token is expired");
        await handleTokenRefresh();
      } else {
        console.error("Error fetching tasks:", await response.text());
      }
    } catch (error) {
      console.error("Fetch tasks error:", error);
    }
  }

  async function handleTokenRefresh() {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing session:", error);
      await signOut();
    } else if (session) {
      localStorage.setItem("token", session.access_token);
      await fetchTasks();
    }
  }

  function renderTasks(tasks) {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    tasks.forEach((task) => {
      const listItem = document.createElement("li");

      const taskTitle = document.createElement("span");
      taskTitle.className = "task-title";
      taskTitle.textContent = task.title;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.complete;
      checkbox.addEventListener("change", () => {
        updateTaskCompletion(task.id, task.title, checkbox.checked);
      });

      const taskActions = document.createElement("div");
      taskActions.className = "task-actions";

      const editButton = document.createElement("button");
      editButton.className = "task-button edit";
      editButton.textContent = "";
      editButton.addEventListener("click", () => {
        editTask(task.id, task.title);
      });

      const deleteButton = document.createElement("button");
      deleteButton.className = "task-button delete";
      deleteButton.textContent = "";
      deleteButton.addEventListener("click", () => {
        deleteTask(task.id);
      });

      taskActions.appendChild(editButton);
      taskActions.appendChild(deleteButton);

      listItem.appendChild(checkbox);
      listItem.appendChild(taskTitle);
      listItem.appendChild(taskActions);
      taskList.appendChild(listItem);
    });
  }

  async function createTask(title, complete = false) {
    const token = localStorage.getItem("token");
    if (!token) {
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      const id = IDgenerator();
      tasks.push({ id, title, complete });
      localStorage.setItem("tasks", JSON.stringify(tasks));
      fetchTasks(); 
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, complete }),
      });

      if (response.ok) {
        fetchTasks();
      } else {
        console.error("Error creating task:", await response.text());
      }
    } catch (error) {
      console.error("Create task error:", error);
    }
  }

  function IDgenerator() {
    return Date.now().toString(16) + Math.random().toString(16);
  }

  async function updateTaskCompletion(id, title, complete) {
    const token = localStorage.getItem("token");
    if (!token) {
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      const index = tasks.findIndex((task) => task.id === id);
      if (index !== -1) {
        tasks[index].complete = complete;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        fetchTasks(); // Refresh the task list after updating the task
      }
      return;
    }
  
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, complete }),
      });
  
      if (!response.ok) {
        console.error("Error updating task:", await response.text());
      } else {
        fetchTasks(); // Refresh the task list after updating the task
      }
    } catch (error) {
      console.error("Update task error:", error);
    }
  }

  async function editTask(id, oldTitle) {
    const newTitle = prompt("Edit task title:", oldTitle);
    if (newTitle === null || newTitle.trim() === "") {
      return; // User cancelled or didn't enter a new title
    }

    const token = localStorage.getItem("token");
    if (!token) {
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      const index = tasks.findIndex((task) => task.id === id);
      if (index !== -1) {
        tasks[index].title = newTitle;
        localStorage.setItem("tasks", JSON.stringify(tasks));
      }
      fetchTasks();

      return;
    }

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        fetchTasks(); // Refresh the task list after editing the task
      } else {
        console.error("Error editing task:", await response.text());
      }
    } catch (error) {
      console.error("Edit task error:", error);
    }
  }

  async function deleteTask(id) {
    const token = localStorage.getItem("token");
    if (!token) {
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      const filteredTasks = tasks.filter((task) => task.id !== id);
      localStorage.setItem("tasks", JSON.stringify(filteredTasks));

      fetchTasks();
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchTasks();
      } else {
        console.error("Error deleting task:", await response.text());
      }
    } catch (error) {
      console.error("Delete task error:", error);
    }
  }

  async function syncLocalTasks() {
    const token = localStorage.getItem("token");
    if (!token) return;

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    for (let task of tasks) {
      delete task.id;
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(task),
        });

        if (!response.ok) {
          console.error("Error syncing task:", await response.text());
        }
      } catch (error) {
        console.error("Sync task error:", error);
      }
    }
    localStorage.removeItem("tasks");
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("expires_at");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("tasks"); // Clear tasks from localStorage
      document.getElementById("auth").style.display = "block";
      document.getElementById("tasks").style.display = "none";
      document.getElementById("signout").style.display = "none";
      window.location.reload();
    }
  }

  async function checkAuth() {
    console.log("Checking authentication...");
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      document.getElementById("auth").style.display = "none";
      document.getElementById("tasks").style.display = "none";
      document.getElementById("signout").style.display = "none";
    } else if (session) {
      const currentTime = Math.floor(Date.now() / 1000);
      const issuedAt = session.access_token.iat;
      if (
        currentTime < issuedAt - 60 ||
        currentTime > issuedAt + session.expires_in
      ) {
        console.error("Token used before issued or expired");
        await signOut();
        return;
      }

      localStorage.setItem("token", session.access_token);
      document.getElementById("auth").style.display = "none";
      document.getElementById("tasks").style.display = "block";
      document.getElementById("signout").style.display = "block";
      await syncLocalTasks();
      await fetchTasks();
    } else {
      document.getElementById("auth").style.display = "block";
      document.getElementById("tasks").style.display = "block";
      document.getElementById("signout").style.display = "none";
      await fetchTasks();
    }
  }

  document
    .getElementById("create-task-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const title = document.getElementById("new-task-title").value;
      if (title) {
        await createTask(title);
        document.getElementById("new-task-title").value = "";
      }
    });

  checkAuth();
  window.signInWithGoogle = signInWithGoogle;
  window.signOut = signOut;
});
