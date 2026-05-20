// HTML 요소를 JavaScript에서 사용할 수 있도록 가져옵니다.
const authCard = document.querySelector("#auth-card");
const appCard = document.querySelector("#app-card");
const authForm = document.querySelector("#auth-form");
const authEmail = document.querySelector("#auth-email");
const authPassword = document.querySelector("#auth-password");
const signupButton = document.querySelector("#signup-button");
const authMessage = document.querySelector("#auth-message");
const userEmail = document.querySelector("#user-email");
const logoutButton = document.querySelector("#logout-button");
const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const prioritySelect = document.querySelector("#priority-select");
const todoSubmitButton = todoForm.querySelector("button");
const todoList = document.querySelector("#todo-list");
const storageStatus = document.querySelector("#storage-status");

// Supabase 프로젝트 연결 정보입니다. anon key는 브라우저에 공개해도 되는 키입니다.
const SUPABASE_URL = "https://bcrbiedayupwarrdiror.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcmJpZWRheXVwd2FycmRpcm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDQ4NjQsImV4cCI6MjA5NDc4MDg2NH0.O-1meEimVd9dvXe-acCTb5dCjY2ZsqL0opmmdUYmCqw";
const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let todos = [];
let currentUser = null;

// 우선순위 값에 맞는 화면 표시 이름입니다.
const priorityLabels = {
  high: "높음",
  medium: "중간",
  low: "낮음"
};

// 좁은 화면에서도 보기 좋게 우선순위를 세로 섹션으로 표시합니다.
const priorityOrder = ["high", "medium", "low"];

let draggedTodoId = null;

function setStorageStatus(message) {
  storageStatus.textContent = message;
}

function setAuthMessage(message) {
  authMessage.textContent = message;
}

function setTodoFormLoading(isLoading) {
  todoInput.disabled = isLoading;
  prioritySelect.disabled = isLoading;
  todoSubmitButton.disabled = isLoading;
  todoSubmitButton.textContent = isLoading ? "저장 중" : "추가";
}

function getErrorMessage(error) {
  if (!error) {
    return "알 수 없는 오류";
  }

  return error.message || error.details || error.code || "알 수 없는 오류";
}

async function handleStorageError(error) {
  console.error("저장 처리 실패:", error);
  setStorageStatus("저장 실패: " + getErrorMessage(error));

  try {
    await refreshTodos();
  } catch (refreshError) {
    console.error("목록 새로고침 실패:", refreshError);
  }
}

function showLoadingMessage() {
  todoList.innerHTML = "";

  const loadingMessage = document.createElement("li");
  loadingMessage.className = "empty-message";
  loadingMessage.textContent = "할 일을 불러오는 중입니다.";
  todoList.appendChild(loadingMessage);
}

function showAuth() {
  appCard.classList.add("is-hidden");
  authCard.classList.remove("is-hidden");
  todoList.innerHTML = "";
  storageStatus.textContent = "";
}

function showApp() {
  authCard.classList.add("is-hidden");
  appCard.classList.remove("is-hidden");
  userEmail.textContent = currentUser.email;
}

function ensureSupabaseClient() {
  if (!supabaseClient) {
    throw new Error("Supabase 스크립트를 불러오지 못했습니다.");
  }
}

async function loadTodosFromSupabase() {
  const result = await supabaseClient
    .from("todos")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  todos = result.data.map(function (todo) {
    return {
      id: todo.id,
      text: todo.text,
      priority: todo.priority || "medium",
      completed: todo.completed,
      position: todo.position
    };
  });
}

async function refreshTodos() {
  await loadTodosFromSupabase();
  renderTodos();
}

async function saveTodoPositions() {
  const updates = todos.map(function (todo, index) {
    return supabaseClient
      .from("todos")
      .update({
        priority: todo.priority || "medium",
        position: index
      })
      .eq("id", todo.id);
  });

  const results = await Promise.all(updates);
  const failedResult = results.find(function (result) {
    return result.error;
  });

  if (failedResult) {
    throw failedResult.error;
  }
}

// 화면에 보이는 할 일 목록을 다시 그립니다.
function renderTodos() {
  todoList.innerHTML = "";

  if (todos.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "아직 등록된 할 일이 없습니다.";
    todoList.appendChild(emptyMessage);
    return;
  }

  priorityOrder.forEach(function (priority) {
    const section = document.createElement("li");
    section.className = "priority-section section-" + priority;

    const sectionTitle = document.createElement("h2");
    sectionTitle.className = "priority-title";
    sectionTitle.textContent = priorityLabels[priority];

    const sectionList = document.createElement("ul");
    sectionList.className = "priority-items";
    sectionList.dataset.priority = priority;

    // 섹션의 빈 영역에 놓으면 해당 우선순위 맨 아래로 이동합니다.
    sectionList.addEventListener("dragover", function (event) {
      event.preventDefault();
      sectionList.classList.add("drag-over");
    });

    sectionList.addEventListener("dragleave", function () {
      sectionList.classList.remove("drag-over");
    });

    sectionList.addEventListener("drop", function (event) {
      event.preventDefault();
      sectionList.classList.remove("drag-over");

      if (event.target === sectionList) {
        moveTodo(draggedTodoId, priority).catch(handleStorageError);
      }
    });

    todos.forEach(function (todo) {
      const todoPriority = todo.priority || "medium";

      if (todoPriority === priority) {
        sectionList.appendChild(createTodoItem(todo));
      }
    });

    section.appendChild(sectionTitle);
    section.appendChild(sectionList);
    todoList.appendChild(section);
  });
}

// 할 일 하나를 화면에 표시할 li 요소로 만듭니다.
function createTodoItem(todo) {
  const todoItem = document.createElement("li");
  const priority = todo.priority || "medium";
  todoItem.className = "todo-item item-" + priority;
  todoItem.draggable = true;
  todoItem.dataset.id = todo.id;

  if (todo.completed) {
    todoItem.classList.add("completed");
  }

  todoItem.addEventListener("dragstart", function () {
    draggedTodoId = todo.id;
    todoItem.classList.add("dragging");
  });

  todoItem.addEventListener("dragend", function () {
    draggedTodoId = null;
    todoItem.classList.remove("dragging");
  });

  todoItem.addEventListener("dragover", function (event) {
    event.preventDefault();
  });

  // 다른 할 일 위에 드롭하면 그 할 일 바로 앞으로 이동합니다.
  // 다른 우선순위 항목 위에 놓으면 드래그한 할 일의 우선순위도 함께 바뀝니다.
  todoItem.addEventListener("drop", function (event) {
    event.preventDefault();
    event.stopPropagation();
    moveTodo(draggedTodoId, priority, todo.id).catch(handleStorageError);
  });

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "todo-checkbox";
  checkbox.checked = todo.completed;

  // 체크박스를 누르면 완료 상태를 반대로 바꿉니다.
  checkbox.addEventListener("change", function () {
    toggleTodo(todo.id).catch(handleStorageError);
  });

  const todoText = document.createElement("span");
  todoText.className = "todo-text";
  todoText.textContent = todo.text;

  const prioritySelectBox = document.createElement("select");
  prioritySelectBox.className = "todo-priority priority-" + priority;
  prioritySelectBox.setAttribute("aria-label", todo.text + " 우선순위 변경");

  Object.keys(priorityLabels).forEach(function (priorityValue) {
    const option = document.createElement("option");
    option.value = priorityValue;
    option.textContent = priorityLabels[priorityValue];

    if (priorityValue === priority) {
      option.selected = true;
    }

    prioritySelectBox.appendChild(option);
  });

  // 우선순위를 바꾸면 저장소에 바로 반영합니다.
  prioritySelectBox.addEventListener("change", function () {
    changePriority(todo.id, prioritySelectBox.value).catch(handleStorageError);
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "삭제";

  // 삭제 버튼을 누르면 해당 할 일을 목록에서 제거합니다.
  deleteButton.addEventListener("click", function () {
    deleteTodo(todo.id).catch(handleStorageError);
  });

  todoItem.appendChild(checkbox);
  todoItem.appendChild(todoText);
  todoItem.appendChild(prioritySelectBox);
  todoItem.appendChild(deleteButton);

  return todoItem;
}

async function addTodo(text, priority) {
  if (!currentUser) {
    showAuth();
    return;
  }

  const result = await supabaseClient
    .from("todos")
    .insert({
      text: text,
      priority: priority,
      completed: false,
      position: todos.length
    });

  if (result.error) {
    throw result.error;
  }

  await refreshTodos();
  setStorageStatus("");
}

// 선택한 할 일의 완료 상태를 변경합니다.
async function toggleTodo(id) {
  const targetTodo = todos.find(function (todo) {
    return todo.id === id;
  });

  if (!targetTodo) {
    return;
  }

  const result = await supabaseClient
    .from("todos")
    .update({ completed: !targetTodo.completed })
    .eq("id", id);

  if (result.error) {
    throw result.error;
  }

  await refreshTodos();
  setStorageStatus("");
}

// 선택한 할 일의 우선순위를 변경합니다.
async function changePriority(id, priority) {
  const result = await supabaseClient
    .from("todos")
    .update({ priority: priority })
    .eq("id", id);

  if (result.error) {
    throw result.error;
  }

  await refreshTodos();
  setStorageStatus("");
}

// 드래그한 할 일을 원하는 우선순위와 위치로 이동합니다.
async function moveTodo(id, priority, targetId) {
  if (id === null || id === targetId) {
    return;
  }

  const movedTodo = todos.find(function (todo) {
    return todo.id === id;
  });

  if (!movedTodo) {
    return;
  }

  const remainingTodos = todos.filter(function (todo) {
    return todo.id !== id;
  });

  if (priority) {
    movedTodo.priority = priority;
  }

  if (targetId) {
    const targetIndex = remainingTodos.findIndex(function (todo) {
      return todo.id === targetId;
    });

    if (targetIndex === -1) {
      remainingTodos.push(movedTodo);
    } else {
      remainingTodos.splice(targetIndex, 0, movedTodo);
    }
  } else {
    remainingTodos.push(movedTodo);
  }

  todos = remainingTodos;

  try {
    await saveTodoPositions();
    renderTodos();
    setStorageStatus("");
  } catch (error) {
    console.error("정렬 저장 실패:", error);
    await refreshTodos();
  }
}

// 선택한 할 일을 삭제합니다.
async function deleteTodo(id) {
  const result = await supabaseClient
    .from("todos")
    .delete()
    .eq("id", id);

  if (result.error) {
    throw result.error;
  }

  await refreshTodos();
  setStorageStatus("");
}

async function openTodoApp(user) {
  currentUser = user;
  showApp();
  showLoadingMessage();
  await loadTodosFromSupabase();
  setStorageStatus("");
  renderTodos();
}

async function signInWithEmail() {
  const email = authEmail.value.trim();
  const password = authPassword.value;

  const result = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (result.error) {
    throw result.error;
  }

  await openTodoApp(result.data.user);
}

async function signUpWithEmail() {
  const email = authEmail.value.trim();
  const password = authPassword.value;

  const result = await supabaseClient.auth.signUp({
    email: email,
    password: password
  });

  if (result.error) {
    throw result.error;
  }

  if (result.data.session && result.data.user) {
    await openTodoApp(result.data.user);
    return;
  }

  setAuthMessage("회원가입 확인 메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.");
}

// form의 submit 이벤트는 버튼 클릭과 Enter 키 입력을 모두 처리합니다.
todoForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const todoText = todoInput.value.trim();
  const selectedPriority = prioritySelect.value;

  // 빈 값이나 공백만 입력한 경우에는 추가하지 않습니다.
  if (todoText === "") {
    todoInput.focus();
    return;
  }

  setTodoFormLoading(true);
  setStorageStatus("저장 중입니다.");

  try {
    await addTodo(todoText, selectedPriority);
    todoInput.value = "";
    prioritySelect.value = "medium";
    setStorageStatus("");
  } catch (error) {
    console.error("할 일 추가 실패:", error);
    setStorageStatus("저장 실패: " + getErrorMessage(error));
  } finally {
    setTodoFormLoading(false);
    todoInput.focus();
  }
});

authForm.addEventListener("submit", function (event) {
  event.preventDefault();
  setAuthMessage("로그인 중입니다.");

  signInWithEmail()
    .then(function () {
      setAuthMessage("");
      authPassword.value = "";
    })
    .catch(function (error) {
      console.error("로그인 실패:", error);
      setAuthMessage("로그인 실패: " + getErrorMessage(error));
    });
});

signupButton.addEventListener("click", function () {
  if (!authForm.reportValidity()) {
    return;
  }

  setAuthMessage("회원가입 처리 중입니다.");

  signUpWithEmail()
    .then(function () {
      authPassword.value = "";
    })
    .catch(function (error) {
      console.error("회원가입 실패:", error);
      setAuthMessage("회원가입 실패: " + getErrorMessage(error));
    });
});

logoutButton.addEventListener("click", function () {
  supabaseClient.auth.signOut()
    .then(function () {
      currentUser = null;
      todos = [];
      setAuthMessage("");
      showAuth();
    })
    .catch(function (error) {
      console.error("로그아웃 실패:", error);
      setStorageStatus("로그아웃에 실패했습니다.");
    });
});

async function startApp() {
  showAuth();

  try {
    ensureSupabaseClient();

    const sessionResult = await supabaseClient.auth.getSession();

    if (sessionResult.error) {
      throw sessionResult.error;
    }

    if (sessionResult.data.session && sessionResult.data.session.user) {
      await openTodoApp(sessionResult.data.session.user);
    } else {
      setAuthMessage("이메일로 로그인하거나 회원가입해 주세요.");
    }
  } catch (error) {
    console.error("앱 시작 실패:", error);
    setAuthMessage("Supabase 연결을 확인해 주세요.");
  }
}

startApp();
