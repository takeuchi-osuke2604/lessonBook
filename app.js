const students = [{ "id": 1, "name": "千代田 太郎" },
{ "id": 2, "name": "中央 花子" },
{ "id": 3, "name": "港 太郎" },
{ "id": 4, "name": "新宿 花子" },
{ "id": 5, "name": "文京 太郎" },
{ "id": 6, "name": "台東 花子" },
{ "id": 7, "name": "墨田 太郎" },
{ "id": 8, "name": "江東 花子" },
{ "id": 9, "name": "品川 太郎" },
{ "id": 10, "name": "目黒 花子" },
{ "id": 11, "name": "大田 太郎" },
{ "id": 12, "name": "世田谷 花子" },
{ "id": 13, "name": "渋谷 太郎" },
{ "id": 14, "name": "中野 花子" },
{ "id": 15, "name": "杉並 太郎" },
{ "id": 16, "name": "豊島 花子" },
{ "id": 17, "name": "北 太郎" },
{ "id": 18, "name": "荒川 花子" },
{ "id": 19, "name": "板橋 太郎" },
{ "id": 20, "name": "練馬 花子" },
{ "id": 21, "name": "足立 太郎" },
{ "id": 22, "name": "葛飾 花子" },
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
const tomorrowSummary = document.getElementById("tomorrow-summary");
const tomorrowDateLabel = document.getElementById("tomorrow-date-label");
const tomorrowReservationList = document.getElementById("tomorrow-reservation-list");
const monthLabel = document.getElementById("month-label");
const dateGrid = document.getElementById("date-grid");
const selectedDateLabel = document.getElementById("selected-date-label");
const reservationStudentList = document.getElementById("reservation-student-list");
const saveReservationBtn = document.getElementById("save-reservation-btn");
const monthNavButtons = document.querySelectorAll(".month-nav");
const studentDateSummary = document.getElementById("student-date-summary");
const prevDayBtn = document.getElementById("prev-day-btn");
const nextDayBtn = document.getElementById("next-day-btn");
const attendanceDateLabel = document.getElementById("attendance-date-label");

const today = new Date();
let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
let attendanceDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
let selectedStudentId = students[0] ? students[0].id : null;
let newlyToggledDates = new Set();

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

function formatDayOfWeekLabel(date) {
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `（${weekdays[date.getDay()]}）`;
}

function formatMonthLabel(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function formatAttendanceDateLabel(date) {
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterday = new Date(todayDate);
    yesterday.setDate(todayDate.getDate() - 1);
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(todayDate.getDate() + 1);

    const weekday = formatDayOfWeekLabel(date);

    if (getDateKey(date) === getDateKey(todayDate)) {
        return `今日 (${formatDateLabel(date)}) ${weekday}`;
    }
    if (getDateKey(date) === getDateKey(yesterday)) {
        return `昨日 (${formatDateLabel(date)}) ${weekday}`;
    }
    if (getDateKey(date) === getDateKey(tomorrow)) {
        return `明日 (${formatDateLabel(date)}) ${weekday}`;
    }

    return `${formatDateLabel(date)} ${weekday}`;
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
    if (!plannedAttendanceList || !absentAttendanceList || !attendanceSummary || !attendanceDateLabel) return;

    const attendanceColumns = document.querySelector(".attendance-columns");
    const attendanceKey = getDateKey(attendanceDate);
    const reservedStudentIds = reservations[attendanceKey] || [];
    const attendanceForSelectedDay = attendance[attendanceKey] || {};
    const plannedCount = reservedStudentIds.filter((studentId) => {
        const status = attendanceForSelectedDay[studentId];
        return status !== "欠席" && status !== "出席";
    }).length;
    const absentCount = reservedStudentIds.filter((studentId) => attendanceForSelectedDay[studentId] === "欠席").length;

    attendanceDateLabel.textContent = formatAttendanceDateLabel(attendanceDate);
    attendanceSummary.textContent = reservedStudentIds.length
        ? `出席予定 ${plannedCount}名 / 欠席 ${absentCount}名`
        : "予約はありません。";

    if (attendanceColumns) {
        attendanceColumns.style.display = reservedStudentIds.length ? "grid" : "none";
    }

    const tomorrowDate = new Date(attendanceDate);
    tomorrowDate.setDate(attendanceDate.getDate() + 1);
    const tomorrowKey = getDateKey(tomorrowDate);
    const tomorrowReservedStudentIds = reservations[tomorrowKey] || [];
    const tomorrowAttendanceForSelectedDay = attendance[tomorrowKey] || {};
    const tomorrowPlannedCount = tomorrowReservedStudentIds.filter((studentId) => {
        const status = tomorrowAttendanceForSelectedDay[studentId];
        return status !== "欠席" && status !== "出席";
    }).length;
    const tomorrowAbsentCount = tomorrowReservedStudentIds.filter((studentId) => tomorrowAttendanceForSelectedDay[studentId] === "欠席").length;

    if (tomorrowDateLabel) {
        tomorrowDateLabel.textContent = formatDateLabel(tomorrowDate);
    }

    if (tomorrowSummary) {
        tomorrowSummary.textContent = tomorrowReservedStudentIds.length
            ? `明日の予約: 出席予定 ${tomorrowPlannedCount}名 / 欠席 ${tomorrowAbsentCount}名`
            : "明日の予約はありません。";
    }

    if (tomorrowReservationList) {
        tomorrowReservationList.innerHTML = "";

        tomorrowReservedStudentIds.forEach((studentId) => {
            const student = getStudentById(studentId);
            if (!student) return;

            const status = tomorrowAttendanceForSelectedDay[studentId] === "欠席" ? "欠席" : "出席予定";
            const item = document.createElement("li");
            item.className = "student-item tomorrow-item";

            const name = document.createElement("span");
            name.textContent = student.name;

            const statusBadge = document.createElement("span");
            statusBadge.className = `attendance-status ${status === "欠席" ? "absent" : "planned"}`;
            statusBadge.textContent = status;

            item.appendChild(name);
            item.appendChild(statusBadge);
            tomorrowReservationList.appendChild(item);
        });
    }

    plannedAttendanceList.innerHTML = "";
    absentAttendanceList.innerHTML = "";

    if (!reservedStudentIds.length) {
        return;
    }

    reservedStudentIds.forEach((studentId) => {
        const student = getStudentById(studentId);
        if (!student) return;

        const status = attendanceForSelectedDay[studentId];
        if (status === "出席") {
            return;
        }

        const normalizedStatus = status === "欠席" ? "欠席" : "出席予定";
        const isAbsent = normalizedStatus === "欠席";

        const item = document.createElement("li");
        item.className = "attendance-item";

        const name = document.createElement("span");
        name.className = "attendance-name";
        name.textContent = student.name;

        const actions = document.createElement("div");
        actions.className = "attendance-actions";

        const plannedBtn = document.createElement("button");
        plannedBtn.type = "button";
        plannedBtn.className = "action-btn primary";
        plannedBtn.textContent = "出席予定にする";
        if (normalizedStatus === "出席予定") {
            plannedBtn.style.display = "none";
        }
        plannedBtn.addEventListener("click", () => {
            attendance[attendanceKey] = attendance[attendanceKey] || {};
            attendance[attendanceKey][studentId] = "出席予定";
            saveStorage(STORAGE_KEYS.attendance, attendance);
            renderAttendance();
        });

        const absentBtn = document.createElement("button");
        absentBtn.type = "button";
        absentBtn.className = "action-btn warning";
        absentBtn.textContent = "欠席にする";
        if (normalizedStatus === "欠席") {
            absentBtn.style.display = "none";
        }
        absentBtn.addEventListener("click", () => {
            attendance[attendanceKey] = attendance[attendanceKey] || {};
            attendance[attendanceKey][studentId] = "欠席";
            saveStorage(STORAGE_KEYS.attendance, attendance);
            renderAttendance();
        });

        actions.appendChild(plannedBtn);
        actions.appendChild(absentBtn);

        item.appendChild(name);
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

        const dateKey = getDateKey(cellDate);
        const dateButton = document.createElement("button");
        dateButton.type = "button";
        dateButton.className = "date-cell";
        dateButton.textContent = String(cellDate.getDate());

        if (cellDate.getMonth() !== currentMonth.getMonth()) {
            dateButton.classList.add("outside-month");
        }

        const todayKey = getDateKey(today);
        if (dateKey === todayKey) {
            dateButton.classList.add("today");
        }

        const savedDateIds = new Set((reservations[dateKey] || []).map(Number));
        const studentDateIds = new Set((draftReservations[dateKey] || []).map(Number));
        const isNewlyToggled = !savedDateIds.has(selectedStudentId) && studentDateIds.has(selectedStudentId);

        if (studentDateIds.has(selectedStudentId)) {
            dateButton.classList.add("selected");
        }
        if (isNewlyToggled) {
            dateButton.classList.add("newly-added");
        }
        if (dateKey === getDateKey(selectedDate)) {
            dateButton.classList.add("current-selection");
        }

        dateButton.addEventListener("click", () => {
            const dateValue = draftReservations[dateKey] || [];
            const nextIds = new Set(dateValue);
            const wasSavedSelected = (reservations[dateKey] || []).map(Number).includes(selectedStudentId);

            if (nextIds.has(selectedStudentId)) {
                nextIds.delete(selectedStudentId);
                if (wasSavedSelected) {
                    newlyToggledDates.delete(dateKey);
                } else {
                    newlyToggledDates.delete(dateKey);
                }
            } else {
                nextIds.add(selectedStudentId);
                if (!wasSavedSelected) {
                    newlyToggledDates.add(dateKey);
                } else {
                    newlyToggledDates.delete(dateKey);
                }
            }

            draftReservations[dateKey] = Array.from(nextIds).sort((left, right) => left - right);
            renderReservationCalendar();
            renderReservationDetail();
        });

        dateGrid.appendChild(dateButton);
    }
}

function renderReservationDetail() {
    if (!selectedDateLabel || !reservationStudentList) return;

    const currentStudent = students.find((student) => student.id === selectedStudentId) || students[0];

    selectedDateLabel.textContent = `生徒指定: ${currentStudent ? currentStudent.name : "未選択"}`;
    reservationStudentList.innerHTML = "";

    if (studentDateSummary) {
        const selectedDates = Object.entries(draftReservations)
            .filter(([, ids]) => ids.includes(selectedStudentId))
            .map(([dateKey]) => dateKey)
            .sort();

        studentDateSummary.textContent = selectedDates.length
            ? `選択中の生徒: ${currentStudent.name} / 予約日数: ${selectedDates.length}日`
            : `${currentStudent ? currentStudent.name : "選択中の生徒"} の予約日はまだありません。`;
    }

    const selectWrap = document.createElement("label");
    selectWrap.className = "reservation-row";
    selectWrap.textContent = "生徒：";

    const studentSelect = document.createElement("select");
    studentSelect.className = "reservation-student-select";
    students.forEach((student) => {
        const option = document.createElement("option");
        option.value = String(student.id);
        option.textContent = student.name;
        option.selected = student.id === selectedStudentId;
        studentSelect.appendChild(option);
    });

    studentSelect.addEventListener("change", (event) => {
        selectedStudentId = Number(event.target.value);
        renderReservationCalendar();
        renderReservationDetail();
    });

    selectWrap.appendChild(studentSelect);
    reservationStudentList.appendChild(selectWrap);
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
    newlyToggledDates.clear();
    renderAttendance();
    renderReservationCalendar();
    renderReservationDetail();
    saveReservationBtn.textContent = "保存しました";
    window.setTimeout(() => {
        saveReservationBtn.textContent = "保存";
    }, 1000);
});

prevDayBtn.addEventListener("click", () => {
    attendanceDate = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate() - 1);
    renderAttendance();
});

nextDayBtn.addEventListener("click", () => {
    attendanceDate = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate() + 1);
    renderAttendance();
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
