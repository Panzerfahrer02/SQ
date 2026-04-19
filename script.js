const STORAGE_KEY = "sidequestSimulatorQuests";

const questForm = document.getElementById("questForm");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const assigneeInput = document.getElementById("assignee");
const dueDateInput = document.getElementById("dueDate");
const clearAllBtn = document.getElementById("clearAllBtn");

const requestedList = document.getElementById("requestedList");
const acceptedList = document.getElementById("acceptedList");
const completedList = document.getElementById("completedList");
const rejectedList = document.getElementById("rejectedList");

const requestedCount = document.getElementById("requestedCount");
const acceptedCount = document.getElementById("acceptedCount");
const completedCount = document.getElementById("completedCount");
const rejectedCount = document.getElementById("rejectedCount");

let quests = loadQuests();

renderAll();

questForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const assignee = assigneeInput.value.trim();
  const dueDate = dueDateInput.value;

  if (!title || !assignee || !dueDate) {
    alert("Bitte Titel, Person und Fälligkeitsdatum ausfüllen.");
    return;
  }

  const newQuest = {
    id: createId(),
    title: title,
    description: description,
    assignee: assignee,
    dueDate: dueDate,
    status: "requested",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  quests.push(newQuest);
  saveQuests();
  renderAll();
  questForm.reset();
});

clearAllBtn.addEventListener("click", function () {
  const confirmed = confirm("Willst du wirklich alle Sidequests löschen?");
  if (!confirmed) {
    return;
  }

  quests = [];
  saveQuests();
  renderAll();
});

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return "quest-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
}

function loadQuests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Fehler beim Laden der Quests:", error);
    return [];
  }
}

function saveQuests() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quests));
}

function renderAll() {
  clearLists();

  const requested = quests.filter((quest) => quest.status === "requested");
  const accepted = quests.filter((quest) => quest.status === "accepted");
  const completed = quests.filter((quest) => quest.status === "completed");
  const rejected = quests.filter((quest) => quest.status === "rejected");

  updateCounters(requested, accepted, completed, rejected);

  renderQuestGroup(requested, requestedList);
  renderQuestGroup(accepted, acceptedList);
  renderQuestGroup(completed, completedList);
  renderQuestGroup(rejected, rejectedList);
}

function updateCounters(requested, accepted, completed, rejected) {
  requestedCount.textContent = requested.length;
  acceptedCount.textContent = accepted.length;
  completedCount.textContent = completed.length;
  rejectedCount.textContent = rejected.length;
}

function clearLists() {
  requestedList.innerHTML = "";
  acceptedList.innerHTML = "";
  completedList.innerHTML = "";
  rejectedList.innerHTML = "";
}

function renderQuestGroup(group, targetElement) {
  if (group.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent = "Keine Quests vorhanden.";
    targetElement.appendChild(emptyMessage);
    return;
  }

  group
    .slice()
    .sort(function (a, b) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    })
    .forEach(function (quest) {
      const card = createQuestCard(quest);
      targetElement.appendChild(card);
    });
}

function createQuestCard(quest) {
  const card = document.createElement("article");
  card.className = "quest-card";

  const title = document.createElement("h3");
  title.textContent = quest.title;

  const assignee = document.createElement("p");
  assignee.innerHTML = "<strong>Für:</strong> " + escapeHtml(quest.assignee);

  const description = document.createElement("p");
  description.innerHTML =
    "<strong>Beschreibung:</strong> " +
    (quest.description ? escapeHtml(quest.description) : "Keine Beschreibung");

  const dueDate = document.createElement("p");
  dueDate.innerHTML = "<strong>Fällig am:</strong> " + formatDate(quest.dueDate);

  const statusInfo = document.createElement("p");
  statusInfo.className = "status-info";
  statusInfo.textContent = getStatusText(quest);

  const actions = document.createElement("div");
  actions.className = "quest-actions";

  if (quest.status === "requested") {
    actions.appendChild(
      createButton("Annehmen", "accept-btn", function () {
        updateStatus(quest.id, "accepted");
      })
    );

    actions.appendChild(
      createButton("Ablehnen", "reject-btn", function () {
        updateStatus(quest.id, "rejected");
      })
    );
  }

  if (quest.status === "accepted") {
    actions.appendChild(
      createButton("Als absolviert markieren", "complete-btn", function () {
        updateStatus(quest.id, "completed");
      })
    );

    actions.appendChild(
      createButton("Ablehnen", "reject-btn", function () {
        updateStatus(quest.id, "rejected");
      })
    );
  }

  if (quest.status === "completed" || quest.status === "rejected") {
    actions.appendChild(
      createButton("Zurück auf angefragt", "reset-btn", function () {
        updateStatus(quest.id, "requested");
      })
    );
  }

  actions.appendChild(
    createButton("Löschen", "delete-btn", function () {
      deleteQuest(quest.id);
    })
  );

  card.appendChild(title);
  card.appendChild(assignee);
  card.appendChild(description);
  card.appendChild(dueDate);
  card.appendChild(statusInfo);
  card.appendChild(actions);

  return card;
}

function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function updateStatus(id, newStatus) {
  quests = quests.map(function (quest) {
    if (quest.id !== id) {
      return quest;
    }

    return {
      ...quest,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
  });

  saveQuests();
  renderAll();
}

function deleteQuest(id) {
  const confirmed = confirm("Diese Sidequest wirklich löschen?");
  if (!confirmed) {
    return;
  }

  quests = quests.filter(function (quest) {
    return quest.id !== id;
  });

  saveQuests();
  renderAll();
}

function getStatusText(quest) {
  if (quest.status === "requested") {
    return "Status: Offen";
  }

  if (quest.status === "accepted") {
    const today = new Date();
    const due = new Date(quest.dueDate);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (due.getTime() > today.getTime()) {
      return "Status: Angenommen";
    }

    if (due.getTime() === today.getTime()) {
      return "Status: Angenommen · Heute fällig";
    }

    return "Status: Angenommen · Überfällig";
  }

  if (quest.status === "completed") {
    return "Status: Absolviert";
  }

  if (quest.status === "rejected") {
    return "Status: Abgelehnt";
  }

  return "Status: Unbekannt";
}

function formatDate(dateString) {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
