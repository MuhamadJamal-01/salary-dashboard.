let employees = JSON.parse(localStorage.getItem("employees")) || [];
let editIndex = null;
renderTable();

function submitForm() {
  let name = document.getElementById("name").value;
  let workDays = parseInt(document.getElementById("workDays").value);
  let dailyRate = parseFloat(document.getElementById("dailyRate").value);
  let overtime = parseFloat(document.getElementById("overtime").value) || 0;
  let notes = document.getElementById("notes").value;
  let date = document.getElementById("date").value;

  if (!name || !workDays || !dailyRate) {
    alert("⚠️ Please fill in Name, Work Days, and Daily Rate.");
    return;
  }

  let totalSalary = (workDays * dailyRate) + overtime;

  if (editIndex !== null) {
    employees[editIndex] = { name, workDays, dailyRate, overtime, notes, date, totalSalary };
    editIndex = null;
    document.querySelector("#formBtn").textContent = "➕ Add";
  } else {
    employees.push({ name, workDays, dailyRate, overtime, notes, date, totalSalary });
  }

  saveData();
  renderTable();
  clearForm();
}

function clearForm() {
  document.getElementById("name").value = "";
  document.getElementById("workDays").value = "";
  document.getElementById("dailyRate").value = "";
  document.getElementById("overtime").value = "";
  document.getElementById("notes").value = "";
  document.getElementById("date").value = "";
}

function renderTable() {
  let tbody = document.querySelector("#salaryTable tbody");
  tbody.innerHTML = "";

  employees.forEach((emp, index) => {
    let row = `
      <tr>
        <td>${emp.name}</td>
        <td>${emp.workDays}</td>
        <td>${emp.dailyRate}</td>
        <td>${emp.overtime}</td>
        <td>${emp.totalSalary}</td>
        <td>${emp.notes}</td>
        <td>${emp.date}</td>
        <td class="actions">
          <button onclick="editEmployee(${index})">✏️ Edit</button>
          <button onclick="removeEmployee(${index})">❌ Remove</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });

  updateSummary();
  updateWeeklySummary();
}

function editEmployee(index) {
  let emp = employees[index];
  document.getElementById("name").value = emp.name;
  document.getElementById("workDays").value = emp.workDays;
  document.getElementById("dailyRate").value = emp.dailyRate;
  document.getElementById("overtime").value = emp.overtime;
  document.getElementById("notes").value = emp.notes;
  document.getElementById("date").value = emp.date;

  editIndex = index;
  document.querySelector("#formBtn").textContent = "💾 Save";
}

function removeEmployee(index) {
  employees.splice(index, 1);
  saveData();
  renderTable();
}

function updateSummary() {
  let totalEmployees = employees.length;
  let totalSalary = employees.reduce((sum, emp) => sum + emp.totalSalary, 0);
  let avgSalary = totalEmployees ? (totalSalary / totalEmployees).toFixed(2) : 0;

  document.getElementById("totalEmployees").textContent = totalEmployees;
  document.getElementById("totalSalary").textContent = totalSalary.toFixed(2);
  document.getElementById("avgSalary").textContent = avgSalary;
}

function searchTable() {
  let input = document.getElementById("searchInput").value.toLowerCase();
  let rows = document.querySelectorAll("#salaryTable tbody tr");

  rows.forEach(row => {
    let name = row.cells[0].textContent.toLowerCase();
    row.style.display = name.includes(input) ? "" : "none";
  });
}

function exportCSV() {
  let csv = "Name,Work Days,Daily Rate,Overtime,Total Salary,Notes,Date\n";
  employees.forEach(emp => {
    csv += `${emp.name},${emp.workDays},${emp.dailyRate},${emp.overtime},${emp.totalSalary},${emp.notes},${emp.date}\n`;
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "salary_report.csv";
  link.click();
}

// 📌 Helper: Get week number from date
function getWeekNumber(dateStr) {
  let date = new Date(dateStr);
  let firstDay = new Date(date.getFullYear(), 0, 1);
  let days = Math.floor((date - firstDay) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + firstDay.getDay() + 1) / 7);
}

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Weekly Worker Salary Report", 14, 16);

  let grouped = {};
  employees.forEach(emp => {
    if (!emp.date) return;
    let week = getWeekNumber(emp.date);
    if (!grouped[week]) grouped[week] = [];
    grouped[week].push(emp);
  });

  let y = 30;
  for (let week in grouped) {
    doc.setFontSize(12);
    doc.text(`📅 Week ${week}`, 14, y);
    y += 6;

    let headers = [["Name", "Work Days", "Daily Rate", "Overtime", "Total Salary", "Notes", "Date"]];
    let data = grouped[week].map(emp => [
      emp.name, emp.workDays, emp.dailyRate, emp.overtime, emp.totalSalary, emp.notes, emp.date
    ]);

    if (doc.autoTable) {
      doc.autoTable({
        head: headers,
        body: data,
        startY: y,
        theme: "grid",
        headStyles: { fillColor: [26, 115, 232] }
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    let totalEmployees = grouped[week].length;
    let totalSalary = grouped[week].reduce((sum, emp) => sum + emp.totalSalary, 0);
    let avgSalary = (totalSalary / totalEmployees).toFixed(2);

    doc.setFontSize(10);
    doc.text(`👥 Employees: ${totalEmployees} | 💵 Total Salary: $${totalSalary.toFixed(2)} | 📊 Avg: $${avgSalary}`, 14, y);
    y += 12;
  }

  doc.save("weekly_salary_report.pdf");
}

function updateWeeklySummary() {
  let container = document.getElementById("weeklyContent");
  container.innerHTML = "";

  let grouped = {};
  employees.forEach(emp => {
    if (!emp.date) return;
    let week = getWeekNumber(emp.date);
    if (!grouped[week]) grouped[week] = [];
    grouped[week].push(emp);
  });

  if (Object.keys(grouped).length === 0) {
    container.innerHTML = "<p>No data available.</p>";
    return;
  }

  for (let week in grouped) {
    let totalEmployees = grouped[week].length;
    let totalSalary = grouped[week].reduce((sum, emp) => sum + emp.totalSalary, 0);
    let avgSalary = (totalSalary / totalEmployees).toFixed(2);

    let div = document.createElement("div");
    div.classList.add("week-card");
    div.innerHTML = `
      <h3>Week ${week}</h3>
      <p>👥 Employees: <strong>${totalEmployees}</strong></p>
      <p>💵 Total Salary: <strong>$${totalSalary.toFixed(2)}</strong></p>
      <p>📊 Average Salary: <strong>$${avgSalary}</strong></p>
    `;
    container.appendChild(div);
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem("employees", JSON.stringify(employees));
}
