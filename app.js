const students = [{ "id": 1, "name": "千代田 太郎" },
{ "id": 2, "name": "中央 太郎" },
{ "id": 3, "name": "港 太郎" },
{ "id": 4, "name": "新宿 太郎" },
{ "id": 5, "name": "文京 太郎" },
{ "id": 6, "name": "台東 太郎" },
{ "id": 7, "name": "墨田 太郎" },
{ "id": 8, "name": "江東 太郎" },
{ "id": 9, "name": "品川 太郎" },
{ "id": 10, "name": "目黒 太郎" },
{ "id": 11, "name": "大田 太郎" },
{ "id": 12, "name": "世田谷 太郎" },
{ "id": 13, "name": "渋谷 太郎" },
{ "id": 14, "name": "中野 太郎" },
{ "id": 15, "name": "杉並 太郎" },
{ "id": 16, "name": "豊島 太郎" },
{ "id": 17, "name": "北 太郎" },
{ "id": 18, "name": "荒川 太郎" },
{ "id": 19, "name": "板橋 太郎" },
{ "id": 20, "name": "練馬 太郎" },
{ "id": 21, "name": "足立 太郎" },
{ "id": 22, "name": "葛飾 太郎" },
{ "id": 23, "name": "江戸川 太郎" }
];

const STORAGE_KEYS = {
    reservations: "lessonBook.reservations",
    attendance: "lessonBook.attendance"
};

const tabs = document.querySelectorAll(".tab");
const screens = document.querySelectorAll(".screen");
const studentList = document.getElementById("student-list");
const plannedAttendanceList = document.getElementById("planned-attendance-list");
const absentAttendanceList = document.getElementById("absent-attendance-list");
const attendanceSummary = document.getElementById("attendance-summary");
const monthLabel = document.getElementById("month-label");
const dateGrid = document.getElementById("date-grid");
const selectedDateLabel = document.getElementById("selected-date-label");
const reservationStudentList = document.getElementById("reservation-student-list");
const saveReservationBtn = document.getElementById("save-reservation-btn");
const monthNavButtons = document.querySelectorAll(".month-nav");

const today = new Date();
let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

let reservations = loadStorage(STORAGE_KEYS.reservations, {});
let attendance = loadStorage(STORAGE_KEYS.attendance, {});
let draftReservations = deepCopy(reservations);

function deepCopy(data) {
    return JSON.parse(JSON.stringify(data));
}

function loadStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error("保存データの読み込みに失敗しました", error);
        return fallback;
    }
}

function saveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("保存データの保存に失敗しました", error);
    }
}

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateLabel(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatMonthLabel(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function getStudentById(studentId) {
    return students.find((student) => student.id === studentId);
}

function renderStudents() {
    if (!studentList) return;

    studentList.innerHTML = "";

    students.forEach((student) => {
        const listItem = document.createElement("li");
        listItem.className = "student-item";
        listItem.textContent = student.name;
        studentList.appendChild(listItem);
    });
}

function renderAttendance() {
    if (!plannedAttendanceList || !absentAttendanceList || !attendanceSummary) return;

    const todayKey = getDateKey(today);
    const reservedStudentIds = reservations[todayKey] || [];
    const attendanceForToday = attendance[todayKey] || {};
    const plannedCount = reservedStudentIds.filter((studentId) => {
        const status = attendanceForToday[studentId];
        return status !== "欠席";
    }).length;
    const absentCount = reservedStudentIds.filter((studentId) => attendanceForToday[studentId] === "欠席").length;

    attendanceSummary.textContent = reservedStudentIds.length
        ? `出席予定 ${plannedCount}名 / 欠席 ${absentCount}名`
        : "本日の予約はありません。";

    plannedAttendanceList.innerHTML = "";
    absentAttendanceList.innerHTML = "";

    if (!reservedStudentIds.length) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "student-item";
        emptyItem.textContent = "予約者がまだいません。";
        plannedAttendanceList.appendChild(emptyItem);
        return;
    }

    reservedStudentIds.forEach((studentId) => {
        const student = getStudentById(studentId);
        if (!student) return;

        const status = attendanceForToday[studentId] || "予定";
        const isAbsent = status === "欠席";
        const statusLabel = status === "出席" ? "出席" : status === "欠席" ? "欠席" : "出席予定";
        const statusClass = status === "出席" ? "present" : status === "欠席" ? "absent" : "planned";

        const item = document.createElement("li");
        item.className = "attendance-item";

        const name = document.createElement("span");
        name.className = "attendance-name";
        name.textContent = student.name;

        const statusBadge = document.createElement("span");
        statusBadge.className = `attendance-status ${statusClass}`;
        statusBadge.textContent = statusLabel;

        const actions = document.createElement("div");
        actions.className = "attendance-actions";

        const presentBtn = document.createElement("button");
        presentBtn.type = "button";
        presentBtn.className = "action-btn primary";
        presentBtn.textContent = "出席";
        presentBtn.addEventListener("click", () => {
            attendance[todayKey] = attendance[todayKey] || {};
            attendance[todayKey][studentId] = "出席";
            saveStorage(STORAGE_KEYS.attendance, attendance);
            renderAttendance();
        });

        const absentBtn = document.createElement("button");
        absentBtn.type = "button";
        absentBtn.className = "action-btn warning";
        absentBtn.textContent = "欠席";
        absentBtn.addEventListener("click", () => {
            attendance[todayKey] = attendance[todayKey] || {};
            attendance[todayKey][studentId] = "欠席";
            saveStorage(STORAGE_KEYS.attendance, attendance);
            renderAttendance();
        });

        const resetBtn = document.createElement("button");
        resetBtn.type = "button";
        resetBtn.className = "action-btn";
        resetBtn.textContent = "戻す";
        resetBtn.addEventListener("click", () => {
            if (!attendance[todayKey]) return;
            delete attendance[todayKey][studentId];
            if (!Object.keys(attendance[todayKey]).length) {
                delete attendance[todayKey];
            }
            saveStorage(STORAGE_KEYS.attendance, attendance);
            renderAttendance();
        });

        actions.appendChild(presentBtn);
        actions.appendChild(absentBtn);
        actions.appendChild(resetBtn);

        item.appendChild(name);
        item.appendChild(statusBadge);
        item.appendChild(actions);

        if (isAbsent) {
            absentAttendanceList.appendChild(item);
        } else {
            plannedAttendanceList.appendChild(item);
        }
    });
}

function renderReservationCalendar() {
    if (!dateGrid || !monthLabel) return;

    monthLabel.textContent = formatMonthLabel(currentMonth);
    dateGrid.innerHTML = "";

    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

    for (let dayIndex = 0; dayIndex < 42; dayIndex += 1) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + dayIndex);

        const dateButton = document.createElement("button");
        dateButton.type = "button";
        dateButton.className = "date-cell";
        dateButton.textContent = String(cellDate.getDate());

        if (cellDate.getMonth() !== currentMonth.getMonth()) {
            dateButton.classList.add("outside-month");
        }

        const dateKey = getDateKey(cellDate);
        const todayKey = getDateKey(today);
        if (dateKey === todayKey) {
            dateButton.classList.add("today");
        }

        if (dateKey === getDateKey(selectedDate)) {
            dateButton.classList.add("selected");
        }

        dateButton.addEventListener("click", () => {
            selectedDate = new Date(cellDate);
            currentMonth = new Date(cellDate.getFullYear(), cellDate.getMonth(), 1);
            renderReservationCalendar();
            renderReservationDetail();
        });

        dateGrid.appendChild(dateButton);
    }
}

function renderReservationDetail() {
    if (!selectedDateLabel || !reservationStudentList) return;

    const dateKey = getDateKey(selectedDate);
    const reservedIds = new Set((draftReservations[dateKey] || []).map(Number));
    selectedDateLabel.textContent = `${formatDateLabel(selectedDate)} の予約`;

    reservationStudentList.innerHTML = "";

    students.forEach((student) => {
        const item = document.createElement("label");
        item.className = "reservation-row";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = reservedIds.has(student.id);

        checkbox.addEventListener("change", (event) => {
            const nextIds = new Set(draftReservations[dateKey] || []);
            if (event.target.checked) {
                nextIds.add(student.id);
            } else {
                nextIds.delete(student.id);
            }

            draftReservations[dateKey] = Array.from(nextIds).sort((left, right) => left - right);
        });

        const name = document.createElement("span");
        name.className = "reservation-name";
        name.textContent = student.name;

        item.appendChild(checkbox);
        item.appendChild(name);
        reservationStudentList.appendChild(item);
    });
}

monthNavButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const action = button.dataset.action;
        const monthIncrement = action === "prev-month" ? -1 : 1;
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthIncrement, 1);
        selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        renderReservationCalendar();
        renderReservationDetail();
    });
});

saveReservationBtn.addEventListener("click", () => {
    reservations = deepCopy(draftReservations);
    saveStorage(STORAGE_KEYS.reservations, reservations);
    renderAttendance();
    saveReservationBtn.textContent = "保存しました";
    window.setTimeout(() => {
        saveReservationBtn.textContent = "保存";
    }, 1000);
});

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const targetScreen = tab.dataset.screen;

        tabs.forEach((item) => {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        screens.forEach((screen) => {
            screen.classList.remove("active");
        });

        const target = document.getElementById(targetScreen);
        if (target) {
            target.classList.add("active");
        }
    });
});

renderStudents();
renderAttendance();
renderReservationCalendar();
renderReservationDetail();
