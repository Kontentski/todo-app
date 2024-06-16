document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = "https://mkfqpkulqicuhpawsmsk.supabase.co";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZnFwa3VscWljdWhwYXdzbXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY5ODA5ODksImV4cCI6MjAzMjU1Njk4OX0.J3OhpYNObgzHAliz9pQhsOzH0k-lS6cm0qFfzkqGXOg";
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
      toggleDeleteCheckedButton(tasks);
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

        localStorage.setItem("tasks", JSON.stringify(tasks));
        toggleDeleteCheckedButton(tasks);
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

  function toggleDeleteCheckedButton(tasks) {
    const completedTasks = tasks.filter((task) => task.complete);
    const deleteCheckedButton = document.getElementById("delete-checked-btn");
    if (completedTasks.length > 1) {
      deleteCheckedButton.style.display = "block";
    } else {
      deleteCheckedButton.style.display = "none";
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
      localStorage.setItem("expires_at", session.expires_at);
      await fetchTasks();
      startTokenRefreshTimer();
    }
  }

  function renderTasks(tasks) {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    tasks.forEach((task) => {
      const listItem = document.createElement("li");

      const taskTitle = document.createElement("span");
      taskTitle.className = "task-title";
      taskTitle.contentEditable = true;
      taskTitle.textContent = task.title;

      let originalTitle = task.title;

      taskTitle.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          taskTitle.textContent = originalTitle;
          taskTitle.blur();
        } else if (event.key === "Enter") {
          if (!event.shiftKey) {
            event.preventDefault();
            taskTitle.blur();
          }
        }
      });

      taskTitle.addEventListener("blur", () => {
        const trimmedTitle = taskTitle.textContent.trim();
        if (trimmedTitle !== originalTitle) {
          updateTask(task.id, { title: trimmedTitle });
          originalTitle = trimmedTitle;
        }
      });

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.complete;
      checkbox.addEventListener("change", () => {
        updateTask(task.id, { complete: checkbox.checked });
      });

      const taskActions = document.createElement("div");
      taskActions.className = "task-actions";

      const deleteButton = document.createElement("button");
      deleteButton.className = "task-button delete";
      deleteButton.textContent = "";
      deleteButton.addEventListener("click", () => {
        deleteTask(task.id);
      });

      taskActions.appendChild(deleteButton);

      listItem.appendChild(checkbox);
      listItem.appendChild(taskTitle);
      listItem.appendChild(taskActions);
      taskList.appendChild(listItem);
    });
  }

  async function createTask(title, complete = false) {
    const token = localStorage.getItem("token");
    const tempId = IDgenerator();
    const newTask = { id: tempId, title, complete };

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(newTask);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks(tasks);

    if (!token) {
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
        const createdTask = await response.json();

        tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        const taskIndex = tasks.findIndex((task) => task.id === tempId);
        if (taskIndex !== -1) {
          tasks[taskIndex] = { ...tasks[taskIndex], id: createdTask.id };
          localStorage.setItem("tasks", JSON.stringify(tasks));
          renderTasks(tasks);
          fetchTasks();
        }
      } else {
        console.error("Error creating task:", await response.text());
      }
    } catch (error) {
      console.error("Create task error:", error);
    }
  }

  function IDgenerator() {
    return "local" + Date.now().toString(16) + Math.random().toString(16);
  }

  async function updateTask(id, updatedFields) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const index = tasks.findIndex((task) => task.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updatedFields };
      localStorage.setItem("tasks", JSON.stringify(tasks));
      toggleDeleteCheckedButton(tasks);
      renderTasks(tasks);
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      const responseGet = await fetch(`/api/tasks/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (responseGet.ok) {
        const existingTask = await responseGet.json();
        const updatedTask = { ...existingTask, ...updatedFields };

        const responseUpdate = await fetch(`/api/tasks/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTask),
        });

        if (responseUpdate.ok) {
          console.log("Task updated in database successfully");
        } else {
          console.error("Error updating task:", await responseUpdate.text());
        }
      } else {
        console.error(
          "Error fetching existing task:",
          await responseGet.text()
        );
      }
    } catch (error) {
      console.error("Update task error:", error);
    }
  }

  async function deleteTask(id) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const filteredTasks = tasks.filter((task) => task.id !== id);
    localStorage.setItem("tasks", JSON.stringify(filteredTasks));
    renderTasks(filteredTasks);

    const token = localStorage.getItem("token");
    if (!token) {
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
        console.log("Task deleted from database successfully");
      } else {
        console.error(
          "Error deleting task from database:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Delete task error:", error);
    }
  }

  async function deleteChecked() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const filteredTasks = tasks.filter((task) => !task.complete);
    localStorage.setItem("tasks", JSON.stringify(filteredTasks));
    toggleDeleteCheckedButton(filteredTasks);
    renderTasks(filteredTasks);

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      const response = await fetch("/api/tasks/delete-checked", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log("Checked tasks deleted from database successfully");
      } else {
        console.error(
          "Error deleting checked tasks from database:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Delete checked tasks error:", error);
    }
  }

  async function syncLocalTasks() {
    const token = localStorage.getItem("token");
    if (!token) return;

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    for (let task of tasks) {
      if (typeof task.id === "string" && task.id.startsWith("local")) {
        try {
          const { id, ...taskWithoutId } = task; // Remove the id field

          const response = await fetch("/api/tasks", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(taskWithoutId),
          });

          if (!response.ok) {
            console.error("Error syncing task:", await response.text());
          } else {
            const createdTask = await response.json();
            // Update local storage with the new task ID
            task.id = createdTask.id;
            localStorage.setItem("tasks", JSON.stringify(tasks));
          }
        } catch (error) {
          console.error("Sync task error:", error);
        }
      }
    }
    renderTasks(tasks);
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
      localStorage.removeItem("tasks");
      document.getElementById("auth").style.display = "block";
      document.getElementById("tasks").style.display = "none";
      document.getElementById("signout").style.display = "none";
      window.location.reload();
    }
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
    }
  }

  let tokenRefreshTimer;

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
    startTokenRefreshTimer();
  }

  function startTokenRefreshTimer() {
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
    }

    const expiresAt = localStorage.getItem("expires_at");
    if (!expiresAt) return;

    const currentTime = Math.floor(Date.now() / 1000);
    const expiresIn = expiresAt - currentTime;

    const refreshTime = (expiresIn - 300) * 1000; // Refresh 5 minutes (300 seconds) before expiration
    tokenRefreshTimer = setTimeout(async () => {
      await handleTokenRefresh();
    }, refreshTime);
  }

  function handleBeforeUnload() {
    const token = localStorage.getItem("token");
    if (token) {
      localStorage.removeItem("tasks");
    }
  }

  window.addEventListener("beforeunload", handleBeforeUnload);

  document
    .getElementById("create-task-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const title = document.getElementById("new-task-title").value;
      if (title) {
        await createTask(title);
        document.getElementById("new-task-title").value = "";
        document.getElementById("new-task-title").blur();
      }
    });

  checkAuth();
  window.signInWithGoogle = signInWithGoogle;
  window.signOut = signOut;
  window.deleteChecked = deleteChecked;
});
