document.addEventListener('DOMContentLoaded', () => {
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    async function signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) {
            console.error('Error signing in:', error);
        }
    }

    async function fetchTasks() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }

        const response = await fetch('/api/tasks', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const tasks = await response.json();
            const taskList = document.getElementById('task-list');
            taskList.innerHTML = '';

            tasks.forEach(task => {
                const listItem = document.createElement('li');
                listItem.textContent = task.title;
                taskList.appendChild(listItem);
            });
        } else {
            console.error('Error fetching tasks:', await response.text());
        }
    }

    async function createTask(title) {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }

        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        });

        if (response.ok) {
            fetchTasks(); // Refresh the task list after creating a new task
        } else {
            console.error('Error creating task:', await response.text());
        }
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('access_token');
            localStorage.removeItem('expires_at');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            document.getElementById('auth').style.display = 'block';
            document.getElementById('tasks').style.display = 'none';
            window.location.reload();
        }
    }

    async function checkAuth() {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error getting session:', error);
        } else if (session) {
            const currentTime = Math.floor(Date.now() / 1000);
            const issuedAt = session.access_token.iat;
            if (currentTime < issuedAt - 60 || currentTime > issuedAt + session.expires_in) {
                console.error('Token used before issued or expired');
                await signOut();
                return;
            }

            localStorage.setItem('token', session.access_token);
            document.getElementById('auth').style.display = 'none';
            document.getElementById('tasks').style.display = 'block';
            fetchTasks();
        } else {
            document.getElementById('auth').style.display = 'block';
            document.getElementById('tasks').style.display = 'none';
        }
    }

    document.getElementById('create-task-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = document.getElementById('new-task-title').value;
        if (title) {
            await createTask(title);
            document.getElementById('new-task-title').value = '';
        }
    });

    checkAuth();

    window.signInWithGoogle = signInWithGoogle;
    window.signOut = signOut;
});
