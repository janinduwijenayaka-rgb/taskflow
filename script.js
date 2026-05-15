/*
================================================================
  TASKFLOW - SCRIPT.JS

  JavaScript කියන්නේ website ට "brain" දෙන file එක.
  HTML = structure, CSS = look, JS = behaviour (action)

  File structure:
  1. Data Layer      - tasks array + localStorage
  2. Utility Functions - helper functions (date, format)
  3. render()        - data → HTML (main engine)
  4. addTask()       - නව task create
  5. advance()       - task status forward move (todo→prog→done)
  6. retreat()       - task status backward move
  7. deleteTask()    - task delete
  8. handleEnter()   - Enter key support
  9. init()          - app start (page load වෙද්දී run වෙනවා)
================================================================
*/


/* ================================================================
   SECTION 1: DATA LAYER

   "tasks" array = app ේ memory.
   සෑම task එකක්ම object එකක් විදිහට store කරනවා:
   {
     id:       "1716800000000"  ← unique ID (timestamp)
     title:    "Assignment submit"
     priority: "high" | "medium" | "low"
     category: "Assignment" | "Project" | ...
     due:      "2026-05-20"  (හෝ "" නැත්නම්)
     status:   "todo" | "prog" | "done"
   }

   localStorage = browser ේ built-in storage.
   Page close/refresh කළත් data save වෙලා ඉනවා.
   (Chrome DevTools → Application → Local Storage ෙකොරෙන් බලන්න පුළුවන්)
================================================================ */

// localStorage key - data save/load කරන්න use කරන නම
const STORAGE_KEY = 'taskflow_tasks';

/**
 * loadTasks()
 * localStorage ෙකොරෙන් tasks read කරනවා.
 * Data නැත්නම් empty array return කරනවා.
 *
 * JSON.parse() = text string → JavaScript object/array
 * (localStorage text විදිහට store කරනවා, object විදිහට නෙවෙයි)
 */
function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  // raw = null (first time) හෝ JSON string
  return raw ? JSON.parse(raw) : [];
}

/**
 * saveTasks()
 * Current tasks array localStorage ට write කරනවා.
 *
 * JSON.stringify() = JavaScript object/array → text string
 * (localStorage ට save කරන්නනම් string ඕනෙ)
 */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// App start වෙද්දී tasks load කරනවා (bottom ේ init() call කරනවා)
let tasks = loadTasks();


/* ================================================================
   SECTION 2: UTILITY FUNCTIONS

   Utility = helper functions - small, reusable tasks.
================================================================ */

/**
 * generateId()
 * Unique ID generate කරනවා.
 * Date.now() = current timestamp milliseconds ෙකොරෙන්
 * (e.g. "1716823456789")
 * ඇයි unique? → millisecond level accurate නිසා
 * practically never repeats.
 */
function generateId() {
  return Date.now().toString();
}

/**
 * isOverdue(dueString)
 * Task ේ due date past වෙලාද කියලා check කරනවා.
 *
 * @param {string} dueString - "2026-05-10" format date string
 * @returns {boolean} - true = overdue, false = ok / no date
 *
 * Note: new Date("2026-05-10") = Date object
 *       new Date(new Date().toDateString()) = today midnight
 *       Compare කරනවා: due date < today midnight?
 */
function isOverdue(dueString) {
  if (!dueString) return false; // due date නැත්නම් overdue නෙවෙයි
  const dueDate   = new Date(dueString);
  const todayMidnight = new Date(new Date().toDateString());
  return dueDate < todayMidnight;
}

/**
 * formatDueDate(dueString)
 * "2026-05-20" → "20 May" readable format ට convert කරනවා.
 *
 * @param {string} dueString
 * @returns {string} formatted date e.g. "20 May"
 *
 * toLocaleDateString() = Date object → readable string
 * options ෙකොරෙන් format control කරනවා
 */
function formatDueDate(dueString) {
  if (!dueString) return '';
  const d = new Date(dueString);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  // e.g. "20 May", "3 Jun"
}

/**
 * getToday()
 * Today ේ date "YYYY-MM-DD" format ෙකොරෙන් return කරනවා.
 * Date input ේ default value set කරන්න use කරනවා.
 *
 * toISOString() = "2026-05-20T00:00:00.000Z"
 * .split('T')[0] = "2026-05-20" (time part cut)
 */
function getToday() {
  return new Date().toISOString().split('T')[0];
}


/* ================================================================
   SECTION 3: RENDER FUNCTION

   render() = App ේ "engine".
   tasks array → HTML ෙකොරෙන් screen update කරනවා.

   Process:
   1. tasks ෙකොරෙන් status ෙකොරෙන් group කරනවා
   2. Stats cards update (numbers)
   3. Progress bar update
   4. Each column ේ task cards HTML generate කරනවා

   ඇයි render() pattern?
   Data change වෙද්දී (add/delete/move) render() call කරනවා.
   Screen automatically latest data reflect කරනවා.
   "Single source of truth" = tasks array.
================================================================ */

function render() {

  // --- Step 1: Tasks ෙකොරෙන් status ෙකොරෙන් group ---
  // filter() = array ෙකොරෙන් condition match element ගන්නවා
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const progTasks = tasks.filter(t => t.status === 'prog');
  const doneTasks = tasks.filter(t => t.status === 'done');

  // Overdue count: done නොවෙන + due date past වෙච්ච tasks
  const overdueCount = tasks.filter(
    t => t.status !== 'done' && isOverdue(t.due)
  ).length;


  // --- Step 2: Stats cards update ---
  // getElementById() = id ෙකොරෙන් HTML element find කරනවා
  // .textContent = element ේ text content change කරනවා
  document.getElementById('s-total').textContent = tasks.length;
  document.getElementById('s-done').textContent  = doneTasks.length;
  document.getElementById('s-prog').textContent  = progTasks.length;
  document.getElementById('s-over').textContent  = overdueCount;

  // Column counts (pill badges)
  document.getElementById('count-todo').textContent = todoTasks.length;
  document.getElementById('count-prog').textContent = progTasks.length;
  document.getElementById('count-done').textContent = doneTasks.length;


  // --- Step 3: Progress bar update ---
  // Percentage = done tasks / total tasks * 100
  // Math.round() = decimal ෙකොරෙන් nearest integer
  const pct = tasks.length
    ? Math.round((doneTasks.length / tasks.length) * 100)
    : 0;

  // Progress bar fill width change (CSS transition ෙකොරෙන් animate වෙනවා)
  document.getElementById('global-progress').style.width = pct + '%';
  document.getElementById('progress-label').textContent  = pct + '% complete';


  // --- Step 4: Render each column ---
  renderColumn('col-todo', todoTasks, 'todo');
  renderColumn('col-prog', progTasks, 'prog');
  renderColumn('col-done', doneTasks, 'done');
}


/**
 * renderColumn(colId, colTasks, status)
 * එක column එකක් render කරනවා.
 *
 * @param {string} colId    - HTML element id (e.g. "col-todo")
 * @param {Array}  colTasks - ඒ column ේ tasks
 * @param {string} status   - "todo" | "prog" | "done"
 *
 * innerHTML = element ේ HTML content replace කරනවා.
 * map() = array ෙකොරෙන් transform කරලා නව array හදනවා.
 * join('') = array of strings → single string.
 */
function renderColumn(colId, colTasks, status) {
  const colEl = document.getElementById(colId);

  // Tasks නැත්නම් empty state message පෙන්වනවා
  if (colTasks.length === 0) {
    colEl.innerHTML = '<p class="empty-state">No tasks here</p>';
    return; // function ෙකොරෙන් exit
  }

  // Each task ෙකොරෙන් HTML card string generate කරනවා
  // Template literals (backtick ``) = multiline string + ${variable} interpolation
  colEl.innerHTML = colTasks.map(task => buildTaskCard(task, status)).join('');
}


/**
 * buildTaskCard(task, status)
 * Task object → HTML string convert කරනවා.
 *
 * @param {Object} task   - task object
 * @param {string} status - current column
 * @returns {string} HTML string
 *
 * Template literals:
 *   `Hello ${name}` = "Hello Kamal"
 *   Multiline strings support කරනවා.
 *   Conditions: ${condition ? 'yes' : 'no'} (ternary operator)
 */
function buildTaskCard(task, status) {
  const overdue   = status !== 'done' && isOverdue(task.due);
  const dueTxt    = formatDueDate(task.due);
  const dueClass  = overdue ? 'task-due overdue' : 'task-due';
  const dueMark   = overdue ? '⚠ ' : '';

  // Action buttons - status ෙකොරෙන් decide කරනවා
  // onclick="advance('${task.id}')" → JS function ෙකොරෙන් call
  // task.id string ෙකොරෙන් pass කරනවා → function ෙකොරෙන් task find
  const forwardBtn = status !== 'done'
    ? `<button class="task-btn" onclick="advance('${task.id}')">
         ${status === 'todo' ? 'Start →' : 'Complete ✓'}
       </button>`
    : '';

  const backBtn = status !== 'todo'
    ? `<button class="task-btn" onclick="retreat('${task.id}')">
         ← ${status === 'prog' ? 'Todo' : 'Reopen'}
       </button>`
    : '';

  // Full card HTML
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
   SECTION 4: ADD TASK

   addTask()
   Form ෙකොරෙන් values read කරලා නව task object create කරනවා.
   tasks array ට add කරලා save + render.
================================================================ */

function addTask() {

  // Form values read කරනවා
  // .value = input/select ේ current value
  // .trim() = leading/trailing spaces remove
  const title    = document.getElementById('task-input').value.trim();
  const priority = document.getElementById('priority-select').value;
  const category = document.getElementById('cat-select').value;
  const due      = document.getElementById('due-input').value;

  // Validation: title empty නම් stop (alert show)
  if (!title) {
    alert('Please enter a task name!');
    return; // function ෙකොරෙන් exit - task add නොකරනවා
  }

  // New task object create
  // Object = {} ෙකොරෙන් surround කරන key-value pairs
  const newTask = {
    id:       generateId(),  // unique timestamp ID
    title:    title,
    priority: priority,
    category: category,
    due:      due,
    status:   'todo'         // සෑම නව task ම "todo" ෙකොරෙන් start
  };

  // Array ේ beginning ට add (unshift = front, push = back)
  // unshift use කරනවා → newest task top ෙකොරෙන් show වෙනවා
  tasks.unshift(newTask);

  // Save + re-render
  saveTasks();
  render();

  // Input field clear කරනවා next task ට ready කරන්න
  document.getElementById('task-input').value = '';

  // Task input ට focus දෙනවා - user ට keyboard ෙකොරෙන්ම type කරන්න
  document.getElementById('task-input').focus();
}


/* ================================================================
   SECTION 5: MOVE TASK (advance / retreat)

   advance() = status forward: todo → prog → done
   retreat()  = status backward: prog → todo, done → prog

   Both functions:
   1. tasks array ෙකොරෙන් id match task find කරනවා
   2. status property change කරනවා
   3. save + render
================================================================ */

/**
 * advance(id)
 * Task ේ status forward move කරනවා.
 * todo → prog → done
 *
 * @param {string} id - task ේ unique id
 *
 * find() = condition match වෙන first element return කරනවා
 * t.id === id → ඒ specific task
 */
function advance(id) {
  const task = tasks.find(t => t.id === id);

  if (!task) return; // task නොමැත්නම් exit

  // Status machine: todo → prog → done
  if (task.status === 'todo') {
    task.status = 'prog';
  } else if (task.status === 'prog') {
    task.status = 'done';
  }
  // done ෙකොරෙන් advance නෑ (already last state)

  saveTasks();
  render();
}

/**
 * retreat(id)
 * Task ේ status backward move කරනවා.
 * done → prog → todo
 *
 * @param {string} id - task ේ unique id
 */
function retreat(id) {
  const task = tasks.find(t => t.id === id);

  if (!task) return;

  if (task.status === 'done') {
    task.status = 'prog';
  } else if (task.status === 'prog') {
    task.status = 'todo';
  }
  // todo ෙකොරෙන් retreat නෑ (already first state)

  saveTasks();
  render();
}


/* ================================================================
   SECTION 6: DELETE TASK

   deleteTask(id)
   tasks array ෙකොරෙන් task remove කරනවා.

   filter() = condition TRUE elements ගන්නවා.
   t.id !== id = "ඒ id ඇති task EXCEPT" = delete effect
================================================================ */

function deleteTask(id) {

  // Confirm dialog - user accidentally delete කරන්නේ නැද්ද?
  const confirmed = confirm('Delete this task?');
  if (!confirmed) return; // Cancel press කළොත් exit

  // filter ෙකොරෙන් ඒ task ෙකොරෙන් except කරලා නව array හදනවා
  tasks = tasks.filter(t => t.id !== id);

  saveTasks();
  render();
}


/* ================================================================
   SECTION 7: KEYBOARD SUPPORT

   handleEnter(event)
   Task input ෙකොරෙන් Enter key press කළොත් addTask() call.

   @param {KeyboardEvent} event - keyboard event object
   event.key = press කළ key name ("Enter", "Escape", etc.)
================================================================ */

function handleEnter(event) {
  if (event.key === 'Enter') {
    addTask();
  }
}


/* ================================================================
   SECTION 8: INIT (Initialization)

   init()
   App ේ startup logic.
   Page load වෙද්දී මෙතන run වෙනවා (bottom ේ call කරනවා).

   1. Today ේ date header ට set කරනවා
   2. Date input ේ default value = today
   3. Demo tasks load කරනවා (first time only)
   4. render() call කරලා screen draw කරනවා
================================================================ */

function init() {

  // --- Today's date header ට set ---
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', {
    weekday: 'long',   // "Friday"
    day:     'numeric', // "15"
    month:   'long',   // "May"
    year:    'numeric'  // "2026"
  });
  // e.g. "Friday, 15 May 2026"
  document.getElementById('date-display').textContent = formattedDate;

  // --- Date input default = today ---
  document.getElementById('due-input').value = getToday();

  // --- Demo tasks (first time only) ---
  // tasks.length === 0 → localStorage ෙකොරෙන් nothing → fresh start
  if (tasks.length === 0) {
    tasks = [
      {
        id:       '1',
        title:    'Database assignment submit',
        priority: 'high',
        category: 'Assignment',
        // Yesterday = overdue demo
        due:      new Date(Date.now() - 86400000).toISOString().split('T')[0],
        status:   'todo'
      },
      {
        id:       '2',
        title:    'React project initial plan',
        priority: 'medium',
        category: 'Project',
        // 3 days later
        due:      new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        status:   'prog'
      },
      {
        id:       '3',
        title:    'Read networking chapter 5',
        priority: 'low',
        category: 'Exam',
        due:      '',
        status:   'done'
      }
    ];
    saveTasks(); // demo tasks save කරනවා
  }

  // --- Initial render ---
  render();
}


/* ================================================================
   APP START

   init() call කරනවා.
   Script bottom ේ ඇති නිසා, HTML fully loaded වෙලා ඉවරයි.
   ඒ නිසා getElementById() calls safely work කරනවා.
================================================================ */
init();