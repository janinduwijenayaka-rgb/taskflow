/*
================================================================
  TASKFLOW - SCRIPT.JS (Firebase Version)

  localStorage → Firebase Firestore ට upgrade කළා.
  දැන් ඕනෙම device/browser ෙකොරෙන් same data පෙනෙනවා.

  File structure:
  1. Firebase Config & Init
  2. Data Layer      - Firestore CRUD
  3. Utility Functions
  4. render()        - data → HTML
  5. addTask()
  6. advance() / retreat()
  7. deleteTask()
  8. handleEnter()
  9. init()
================================================================
*/


/* ================================================================
   SECTION 1: FIREBASE CONFIG & INIT

   🔴 IMPORTANT: ඔයාගේ Firebase project ෙකොරෙන් config values
   replace කරන්න ඕනෙ (SETUP_GUIDE.md බලන්න).

   firebaseConfig object = Firebase ට ඔයාගේ project find කරන්න
   ඕනෙ information.
================================================================ */

const firebaseConfig = {
  apiKey:            "AIzaSyBJylwzlgoQOy9pXn36v1KaTkdgQdu8KUM",
  authDomain:        "task-manager-a3310.firebaseapp.com",
  projectId:         "task-manager-a3310",
  storageBucket:     "task-manager-a3310.firebasestorage.app",
  messagingSenderId: "694942090576",
  appId:             "1:694942090576:web:3dc2725d1f06f1bd915855"
};

// Firebase initialize
firebase.initializeApp(firebaseConfig);

// Firestore database reference
// db = database ෙකොරෙන් interact කරන්න use කරන object
const db = firebase.firestore();

// "tasks" collection reference
// Collection = database ේ folder වගේ
const tasksCollection = db.collection('tasks');

// Local cache - Firestore ෙකොරෙන් load කළ tasks memory ෙකොරෙන් keep
let tasks = [];


/* ================================================================
   SECTION 2: FIRESTORE DATA LAYER

   localStorage functions replace කළා Firestore functions ෙකොරෙන්.

   Firestore = NoSQL database (tables නෑ, collections + documents)
   Collection "tasks" → Documents (each = one task)

   Async/Await:
   - Firestore operations network calls → time ගන්නවා
   - async function = "wait for this before continuing"
   - await = "pause here until done"
================================================================ */

/**
 * loadTasksFromDB()
 * Firestore ෙකොරෙන් සියලු tasks load කරනවා.
 * Real-time listener set කරනවා - data change වෙද්දී auto-update.
 *
 * onSnapshot() = real-time listener
 * Data change වෙද්දී (add/update/delete) callback automatically run.
 */
function loadTasksFromDB() {
  // createdAt ෙකොරෙන් order කරනවා - newest first
  tasksCollection
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      // snapshot = current database state
      // docs = array of document snapshots
      tasks = snapshot.docs.map(doc => ({
        // doc.id = Firestore auto-generated document ID
        // doc.data() = document ෙකොරෙන් fields object
        id: doc.id,
        ...doc.data()
      }));
      render(); // data update → screen update
    }, error => {
      console.error('Firestore error:', error);
      showError('Database connection failed. Check your Firebase config.');
    });
}

/**
 * saveTaskToDB(task)
 * නව task Firestore ට add කරනවා.
 *
 * @param {Object} task - task object (id හැරෙන්නට)
 *
 * add() = new document create (Firestore auto ID generate කරනවා)
 * serverTimestamp() = server ේ current time (client time නෙවෙයි)
 */
async function saveTaskToDB(task) {
  try {
    await tasksCollection.add({
      title:     task.title,
      priority:  task.priority,
      category:  task.category,
      due:       task.due,
      status:    task.status,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('Error adding task:', err);
    showError('Task save failed. Please try again.');
  }
}

/**
 * updateTaskInDB(id, updates)
 * Existing task ේ fields update කරනවා.
 *
 * @param {string} id      - Firestore document ID
 * @param {Object} updates - update කරන fields only
 *
 * update() = specific fields update (whole document replace නෙවෙයි)
 */
async function updateTaskInDB(id, updates) {
  try {
    await tasksCollection.doc(id).update(updates);
  } catch (err) {
    console.error('Error updating task:', err);
    showError('Update failed. Please try again.');
  }
}

/**
 * deleteTaskFromDB(id)
 * Firestore ෙකොරෙන් task document delete කරනවා.
 *
 * @param {string} id - Firestore document ID
 *
 * delete() = document permanently remove
 */
async function deleteTaskFromDB(id) {
  try {
    await tasksCollection.doc(id).delete();
  } catch (err) {
    console.error('Error deleting task:', err);
    showError('Delete failed. Please try again.');
  }
}

/**
 * showError(msg)
 * User ට error message show කරනවා.
 */
function showError(msg) {
  alert('⚠️ ' + msg);
}


/* ================================================================
   SECTION 3: UTILITY FUNCTIONS
   (Original functions - unchanged)
================================================================ */

function generateId() {
  return Date.now().toString();
}

function isOverdue(dueString) {
  if (!dueString) return false;
  const dueDate        = new Date(dueString);
  const todayMidnight  = new Date(new Date().toDateString());
  return dueDate < todayMidnight;
}

function formatDueDate(dueString) {
  if (!dueString) return '';
  const d = new Date(dueString);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}


/* ================================================================
   SECTION 4: RENDER FUNCTION
   (Original render - unchanged, uses local "tasks" array)
================================================================ */

function render() {
  const todoTasks    = tasks.filter(t => t.status === 'todo');
  const progTasks    = tasks.filter(t => t.status === 'prog');
  const doneTasks    = tasks.filter(t => t.status === 'done');
  const overdueCount = tasks.filter(
    t => t.status !== 'done' && isOverdue(t.due)
  ).length;

  document.getElementById('s-total').textContent = tasks.length;
  document.getElementById('s-done').textContent  = doneTasks.length;
  document.getElementById('s-prog').textContent  = progTasks.length;
  document.getElementById('s-over').textContent  = overdueCount;

  document.getElementById('count-todo').textContent = todoTasks.length;
  document.getElementById('count-prog').textContent = progTasks.length;
  document.getElementById('count-done').textContent = doneTasks.length;

  const pct = tasks.length
    ? Math.round((doneTasks.length / tasks.length) * 100)
    : 0;

  document.getElementById('global-progress').style.width = pct + '%';
  document.getElementById('progress-label').textContent  = pct + '% complete';

  renderColumn('col-todo', todoTasks, 'todo');
  renderColumn('col-prog', progTasks, 'prog');
  renderColumn('col-done', doneTasks, 'done');
}

function renderColumn(colId, colTasks, status) {
  const colEl = document.getElementById(colId);
  if (colTasks.length === 0) {
    colEl.innerHTML = '<p class="empty-state">No tasks here</p>';
    return;
  }
  colEl.innerHTML = colTasks.map(task => buildTaskCard(task, status)).join('');
}

function buildTaskCard(task, status) {
  const overdue  = status !== 'done' && isOverdue(task.due);
  const dueTxt   = formatDueDate(task.due);
  const dueClass = overdue ? 'task-due overdue' : 'task-due';
  const dueMark  = overdue ? '⚠ ' : '';

  const forwardBtn = status !== 'done'
    ? `<button class="task-btn" onclick="advance('${task.id}')">
         ${status === 'todo' ? 'Start →' : 'Complete ✓'}
       </button>`
    : '';

  const backBtn = status !== 'todo'
    ? `<button class="task-btn" onclick="retreat('${task.id}')">← Back</button>`
    : '';

  return `
    <div class="task-card">
      <p class="task-title">${task.title}</p>
      <div class="task-meta">
        <span class="badge ${task.priority}">${task.priority}</span>
        <span class="badge category">${task.category}</span>
        ${dueTxt
          ? `<span class="${dueClass}">${dueMark}${dueTxt}</span>`
          : ''
        }
      </div>
      <div class="task-actions">
        ${forwardBtn}
        ${backBtn}
        <button class="task-btn delete" onclick="deleteTask('${task.id}')">
          Delete
        </button>
      </div>
    </div>
  `;
}


/* ================================================================
   SECTION 5: ADD TASK
   (localStorage save → Firestore save)
================================================================ */

async function addTask() {
  const title    = document.getElementById('task-input').value.trim();
  const priority = document.getElementById('priority-select').value;
  const category = document.getElementById('cat-select').value;
  const due      = document.getElementById('due-input').value;

  if (!title) {
    alert('Please enter a task name!');
    return;
  }

  const newTask = {
    title:    title,
    priority: priority,
    category: category,
    due:      due,
    status:   'todo'
  };

  // Firestore ට save (async - network call)
  await saveTaskToDB(newTask);
  // ✅ onSnapshot listener automatically tasks update + render() call කරනවා
  // ඒ නිසා manual render() call ඕනෙ නෑ!

  document.getElementById('task-input').value = '';
  document.getElementById('task-input').focus();
}


/* ================================================================
   SECTION 6: MOVE TASK (advance / retreat)
   (localStorage update → Firestore update)
================================================================ */

async function advance(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  let newStatus;
  if (task.status === 'todo')      newStatus = 'prog';
  else if (task.status === 'prog') newStatus = 'done';
  else return; // done → no advance

  // Firestore ෙකොරෙන් status field update කරනවා
  await updateTaskInDB(id, { status: newStatus });
  // onSnapshot auto-triggers render()
}

async function retreat(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  let newStatus;
  if (task.status === 'done')      newStatus = 'prog';
  else if (task.status === 'prog') newStatus = 'todo';
  else return; // todo → no retreat

  await updateTaskInDB(id, { status: newStatus });
}


/* ================================================================
   SECTION 7: DELETE TASK
   (localStorage remove → Firestore delete)
================================================================ */

async function deleteTask(id) {
  const confirmed = confirm('Delete this task?');
  if (!confirmed) return;

  await deleteTaskFromDB(id);
  // onSnapshot auto-triggers render()
}


/* ================================================================
   SECTION 8: KEYBOARD SUPPORT
   (Unchanged)
================================================================ */

function handleEnter(event) {
  if (event.key === 'Enter') {
    addTask();
  }
}


/* ================================================================
   SECTION 9: INIT
   (localStorage load → Firestore real-time listener)
================================================================ */

function init() {
  // Header date
  const now           = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric'
  });
  document.getElementById('date-display').textContent = formattedDate;

  // Date input default = today
  document.getElementById('due-input').value = getToday();

  // Firestore ෙකොරෙන් tasks load + real-time listener start
  // (loadTasksFromDB ෙකොරෙන් onSnapshot set කරනවා)
  loadTasksFromDB();

  // ✅ Demo tasks automatic load නෑ දැන්.
  // Firestore ෙකොරෙන් data load වෙනවා.
  // First time empty board show වෙනවා - user task add කරන්න ඕනෙ.
}

// App start
init();
