const SHEET_ID = "1jdx3t0BLCdjpGvsewJrac70z2RibV4Ap9wH_VOHyIV8";
const SHEET_NAME = "main tab"; 
const WORKING_DAYS_SHEET = "days"; 
const WORKING_DAYS_CELL = "A2"; 
const URL_MAIN = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
const URL_WORKING_DAYS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${WORKING_DAYS_SHEET}`;

let rowsData = [];
let headers = [];
let totalWorkingDays = 0;
let chart;

const requiredColumns = {
    name: 1,
    presentDays: 4,
    lastAttendedDay: 5,
    classAndDiv: 7,
    adminNo: 8,
    uid: 0,
    passcode: 9
};

let libraryInfo = [];

async function fetchGoogleSheetData() {
    try {
        const response = await fetch(URL_MAIN);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));

        headers = [
            json.table.cols[requiredColumns.name].label,
            json.table.cols[requiredColumns.presentDays].label,
            json.table.cols[requiredColumns.lastAttendedDay].label,
            json.table.cols[requiredColumns.classAndDiv].label,
            json.table.cols[requiredColumns.adminNo].label,
            "No of Absent Days"
        ];

        rowsData = json.table.rows.map(row => ({
            uid: row.c[requiredColumns.uid]?.v || "N/A",
            name: row.c[requiredColumns.name]?.v || "N/A",
            presentDays: parseInt(row.c[requiredColumns.presentDays]?.v || "0"),
            lastAttendedDay: row.c[requiredColumns.lastAttendedDay]?.v || "N/A",
            classAndDiv: row.c[requiredColumns.classAndDiv]?.v || "N/A",
            adminNo: row.c[requiredColumns.adminNo]?.v || "N/A",
            passcode: row.c[requiredColumns.passcode]?.v || "N/A"
        }));

        console.log("Rows Data:", rowsData);
        await fetchTotalWorkingDays();
        await fetchLibraryInfo();
        populateDropdown();
    } catch (error) {
        console.error("Error fetching Google Sheet data:", error);
    }
}

async function fetchTotalWorkingDays() {
    try {
        const response = await fetch(URL_WORKING_DAYS);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));

        totalWorkingDays = parseInt(json.table.rows[0].c[0]?.v || "0");
    } catch (error) {
        console.error("Error fetching total working days:", error);
    }
}

async function fetchLibraryInfo() {
    const URL_LIBRARY = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=bLog`;
    try {
        const response = await fetch(URL_LIBRARY);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));

        libraryInfo = json.table.rows.map(row => ({
            bookUid: row.c[0]?.v || "N/A",
            bookName: row.c[1]?.v || "N/A",
            studentUid: row.c[2]?.v || "N/A",
            studentName: row.c[3]?.v || "N/A",
            dateOfTaking: row.c[4]?.v || "N/A"
        }));
       console.log(libraryInfo[0].dateOfTaking);
        console.log("Library Data:", libraryInfo);
    } catch (error) {
        console.error("Error fetching library data:", error);
    }
}

function populateDropdown() {
    const dropdown = document.getElementById("nameDropdown");
    rowsData.forEach(row => {
        const option = document.createElement("option");
        option.value = row.uid;
        option.textContent = row.name;
        dropdown.appendChild(option);
    });
}

function showDetails() {
    const selectedUID = document.getElementById("nameDropdown").value;
   
    if (!selectedUID) {
        alert("Please select a name.");
        return;
    }

  

    const row = rowsData.find(row => row.uid === selectedUID);
    if (!row) {
        alert("No data found for the selected UID.");
        return;
    }

    console.log("Selected student data:", row);

    

    const absentDays = totalWorkingDays - row.presentDays;

    const detailsContainer = document.getElementById("detailsContainer");
    const detailsSection = document.getElementById("details");

    detailsSection.style.display = "block";
    detailsContainer.innerHTML = "";

    headers.forEach((header, index) => {
        const detailItem = document.createElement("div");
        detailItem.className = "detail-item";

        const label = document.createElement("div");
        label.className = "label";
        label.textContent = header;

        const value = document.createElement("div");
        value.className = "value";

        switch (index) {
            case 0: value.textContent = row.name; break;
            case 1: value.textContent = row.presentDays + " Days"; break;
            case 2: value.textContent = row.lastAttendedDay; break;
            case 3: value.textContent = row.classAndDiv; break;
            case 4: value.textContent = row.adminNo; break;
            case 5: value.textContent = absentDays + " Days"; break;
            default: value.textContent = "N/A";
        }

        detailItem.appendChild(label);
        detailItem.appendChild(value);
        detailsContainer.appendChild(detailItem);
    });

    renderChart(row.presentDays, absentDays);
    displayLibraryInfo(selectedUID);
}

function renderChart(presentDays, absentDays) {
    const ctx = document.getElementById("attendanceChart").getContext("2d");

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Present Days", "Absent Days"],
            datasets: [{
                label: "Attendance",
                data: [presentDays, absentDays],
                backgroundColor: ["#4caf50", "#f44336"],
                borderColor: ["#388e3c", "#d32f2f"],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                datalabels: {
                    color: "#ffffff",
                    anchor: "center",
                    align: "center",
                    font: {
                        weight: "bold",
                        size: 14
                    },
                    formatter: (value) => value
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Days"
                    }
                }
            }
        }
    });
}

function displayLibraryInfo(studentUid) {
    const libraryContainer = document.getElementById("libraryContainer");
    const libraryInfoContainer = document.getElementById("libraryInfoContainer");
    libraryInfoContainer.innerHTML = "";

    const booksTaken = libraryInfo.filter(item => item.studentUid === studentUid);

    if (booksTaken.length === 0) {
        libraryInfoContainer.innerHTML = "<p>No books taken by this student.</p>";
        return;
    }

    booksTaken.forEach(book => {
        const bookInfo = document.createElement("div");
        bookInfo.className = "book-info";

        const dateOfTaking = book.dateOfTaking;

        const submissionDate = new Date(dateOfTaking.split('/').reverse().join('-'));
        submissionDate.setDate(submissionDate.getDate() + 7);
        const submissionDateString = formatDate(submissionDate);

        bookInfo.innerHTML = ` 
            <p><strong>Book Name:</strong> ${book.bookName}</p>
            <p><strong>Book UID:</strong> ${book.bookUid}</p>
            <p><strong>Date of Taking:</strong> ${dateOfTaking}</p>
            <p><strong>To be submitted on:</strong> ${submissionDateString}</p>
            <hr />
        `;
        libraryInfoContainer.appendChild(bookInfo);
    });

    libraryContainer.style.display = "block";
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

document.getElementById("fetchDetails").addEventListener("click", showDetails);

fetchGoogleSheetData();
