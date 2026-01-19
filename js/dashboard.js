// Load user profile
function loadUserProfile() {
    const user = getCurrentUser();
    if (user) {
        // Update header
        const headerUserName = document.getElementById('headerUserName');
        const headerUserRole = document.getElementById('headerUserRole');
        const userInitial = document.getElementById('userInitial');
        
        if (headerUserName) {
            headerUserName.textContent = user.name || 'User';
        }
        if (headerUserRole) {
            headerUserRole.textContent = user.position || 'Employee';
        }
        if (userInitial) {
            const name = user.name || 'U';
            userInitial.textContent = name.charAt(0).toUpperCase();
        }
    }
}

// Load attendance records
async function loadAttendanceRecords(filter = 'all') {
    if (!isAuthenticated()) {
        return;
    }

    const user = getCurrentUser();
    if (!user) {
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINTS.getAttendance}?email=${user.email}&filter=${filter}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayAttendanceTable(data.records || []);
            // Also update records page if it's active
            if (document.getElementById('records-page') && document.getElementById('records-page').classList.contains('active')) {
                displayRecordsTable(data.records || []);
            }
        } else {
            console.error('Error loading attendance:', data.detail);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}

// Convert 24-hour time to 12-hour format
function convertTo12Hour(timeStr) {
    if (!timeStr || timeStr === 'N/A') {
        return 'N/A';
    }
    
    try {
        const [hours, minutes, seconds] = timeStr.split(':');
        const hour24 = parseInt(hours);
        const minute = minutes || '00';
        const second = seconds || '00';
        
        if (isNaN(hour24)) {
            return timeStr; // Return original if parsing fails
        }
        
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        let hour12 = hour24 % 12;
        hour12 = hour12 === 0 ? 12 : hour12; // 0 should be 12
        
        return `${String(hour12).padStart(2, '0')}:${minute}:${second} ${ampm}`;
    } catch (error) {
        return timeStr; // Return original if conversion fails
    }
}

// Display attendance table
function displayAttendanceTable(records) {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    if (records.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" style="text-align: center; padding: 30px; color: rgba(255,255,255,0.5);">No attendance records found</td>';
        tbody.appendChild(row);
        updateSummaryCards([]);
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');
        
        const statusClass = getStatusClass(record.status);
        const statusBadge = `<span class="status-badge ${statusClass}">${record.status}</span>`;

        row.innerHTML = `
            <td>${record.date || '-'}</td>
            <td>${record.name || '-'}</td>
            <td>${record.day_name || '-'}</td>
            <td>${convertTo12Hour(record.check_in)}</td>
            <td>${convertTo12Hour(record.check_out)}</td>
            <td>${statusBadge}</td>
            <td>${record.working_hours || '0'}</td>
        `;

        tbody.appendChild(row);
    });

    // Update summary cards
    updateSummaryCards(records);
}

// Update summary cards with statistics
function updateSummaryCards(records) {
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'Present').length;
    const lateDays = records.filter(r => r.status === 'Late').length;
    const absentDays = records.filter(r => r.status === 'Absent').length;

    const totalDaysEl = document.getElementById('totalDays');
    const presentDaysEl = document.getElementById('presentDays');
    const lateDaysEl = document.getElementById('lateDays');
    const absentDaysEl = document.getElementById('absentDays');

    if (totalDaysEl) totalDaysEl.textContent = totalDays;
    if (presentDaysEl) presentDaysEl.textContent = presentDays;
    if (lateDaysEl) lateDaysEl.textContent = lateDays;
    if (absentDaysEl) absentDaysEl.textContent = absentDays;
}

// Get status badge class
function getStatusClass(status) {
    const statusMap = {
        'Present': 'status-present',
        'Late': 'status-late',
        'Early Checkout': 'status-early',
        'Absent': 'status-absent',
        'Off Day': 'status-offday'
    };
    return statusMap[status] || 'status-offday';
}

// Handle filter buttons
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Load records with filter
            const filter = btn.getAttribute('data-filter');
            loadAttendanceRecords(filter);
        });
    });
}

// Check if today is an off day and disable buttons
async function checkOffDay() {
    try {
        const user = getCurrentUser();
        if (!user) return;

        const response = await fetch(`${API_ENDPOINTS.getAttendance}?email=${user.email}&check_day=true`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const data = await response.json();
        
        if (response.ok && data.is_off_day) {
            const offDayMessage = document.getElementById('offDayMessage');
            offDayMessage.textContent = `Today is an off day (${data.day_name}). Attendance actions are disabled.`;
            offDayMessage.classList.add('show');
            
            // Disable buttons
            document.getElementById('checkInBtn').disabled = true;
            document.getElementById('checkOutBtn').disabled = true;
        } else {
            // Enable buttons
            document.getElementById('checkInBtn').disabled = false;
            document.getElementById('checkOutBtn').disabled = false;
        }
    } catch (error) {
        console.error('Error checking off day:', error);
    }
}

// Initialize sidebar action button
function initSidebarActions() {
    const sidebarActionBtn = document.querySelector('.sidebar-action-btn');
    if (sidebarActionBtn) {
        sidebarActionBtn.addEventListener('click', () => {
            // Switch to attendance page
            switchPage('attendance');
        });
    }
}

// Page Navigation
function switchPage(pageName) {
    // Hide all pages
    const allPages = document.querySelectorAll('.page-content');
    allPages.forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const selectedPage = document.getElementById(`${pageName}-page`);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    // Update navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        }
    });

    // Load page-specific data
    if (pageName === 'attendance') {
        loadTodayStatus();
        checkOffDayForAttendance();
    } else if (pageName === 'records') {
        loadRecordsTable('all');
        initRecordsFilters();
    } else if (pageName === 'overview') {
        loadAttendanceRecords('all');
    }
}

// Initialize navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = item.getAttribute('data-page');
            switchPage(pageName);
        });
    });
}

// Load today's status for Attendance page
async function loadTodayStatus() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const response = await fetch(`${API_ENDPOINTS.getAttendance}?email=${user.email}&filter=today`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const data = await response.json();
        const statusContent = document.getElementById('todayStatusContent');

        if (response.ok && data.records && data.records.length > 0) {
            const today = data.records[0];
            statusContent.innerHTML = `
                <p><strong>Date:</strong> ${today.date || 'N/A'}</p>
                <p><strong>Check-In:</strong> ${convertTo12Hour(today.check_in) || 'Not checked in'}</p>
                <p><strong>Check-Out:</strong> ${convertTo12Hour(today.check_out) || 'Not checked out'}</p>
                <p><strong>Status:</strong> <span class="status-badge ${getStatusClass(today.status)}">${today.status || 'N/A'}</span></p>
                <p><strong>Working Hours:</strong> ${today.working_hours || '0'} hours</p>
            `;
        } else {
            statusContent.innerHTML = '<p>No attendance record for today yet. Please check in to start tracking.</p>';
        }
    } catch (error) {
        console.error('Error loading today status:', error);
        const statusContent = document.getElementById('todayStatusContent');
        if (statusContent) {
            statusContent.innerHTML = '<p>Error loading today\'s status. Please try again.</p>';
        }
    }
}

// Check off day for Attendance page
async function checkOffDayForAttendance() {
    try {
        const user = getCurrentUser();
        if (!user) return;

        const response = await fetch(`${API_ENDPOINTS.getAttendance}?email=${user.email}&check_day=true`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const data = await response.json();
        
        if (response.ok && data.is_off_day) {
            const offDayMessage = document.getElementById('offDayMessageAttendance');
            if (offDayMessage) {
                offDayMessage.textContent = `Today is an off day (${data.day_name}). Attendance actions are disabled.`;
                offDayMessage.classList.add('show');
            }
            
            // Disable buttons
            const checkInBtn = document.getElementById('checkInBtnAttendance');
            const checkOutBtn = document.getElementById('checkOutBtnAttendance');
            if (checkInBtn) checkInBtn.disabled = true;
            if (checkOutBtn) checkOutBtn.disabled = true;
        } else {
            // Enable buttons
            const checkInBtn = document.getElementById('checkInBtnAttendance');
            const checkOutBtn = document.getElementById('checkOutBtnAttendance');
            if (checkInBtn) checkInBtn.disabled = false;
            if (checkOutBtn) checkOutBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error checking off day:', error);
    }
}

// Load records table
async function loadRecordsTable(filter = 'all') {
    if (!isAuthenticated()) {
        return;
    }

    const user = getCurrentUser();
    if (!user) {
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINTS.getAttendance}?email=${user.email}&filter=${filter}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayRecordsTable(data.records || []);
        } else {
            console.error('Error loading records:', data.detail);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}

// Display records table
function displayRecordsTable(records) {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (records.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" style="text-align: center; padding: 30px; color: rgba(255,255,255,0.5);">No attendance records found</td>';
        tbody.appendChild(row);
        return;
    }

    records.forEach(record => {
        const row = document.createElement('tr');
        
        const statusClass = getStatusClass(record.status);
        const statusBadge = `<span class="status-badge ${statusClass}">${record.status}</span>`;

        row.innerHTML = `
            <td>${record.date || '-'}</td>
            <td>${record.name || '-'}</td>
            <td>${record.day_name || '-'}</td>
            <td>${convertTo12Hour(record.check_in)}</td>
            <td>${convertTo12Hour(record.check_out)}</td>
            <td>${statusBadge}</td>
            <td>${record.working_hours || '0'}</td>
        `;

        tbody.appendChild(row);
    });
}

// Initialize records filters
function initRecordsFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn-records');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Load records with filter
            const filter = btn.getAttribute('data-filter');
            loadRecordsTable(filter);
        });
    });
}

// Initialize attendance buttons for Attendance page
function initAttendancePageButtons() {
    const checkInBtn = document.getElementById('checkInBtnAttendance');
    const checkOutBtn = document.getElementById('checkOutBtnAttendance');

    if (checkInBtn) {
        checkInBtn.addEventListener('click', handleCheckInForAttendance);
    }

    if (checkOutBtn) {
        checkOutBtn.addEventListener('click', handleCheckOutForAttendance);
    }
}

// Wrapper functions for attendance page buttons
async function handleCheckInForAttendance() {
    await handleCheckIn();
    // Refresh today's status after check-in
    setTimeout(() => {
        loadTodayStatus();
        // Also refresh overview if it's active
        if (document.getElementById('overview-page').classList.contains('active')) {
            loadAttendanceRecords('all');
        }
    }, 1000);
}

async function handleCheckOutForAttendance() {
    await handleCheckOut();
    // Refresh today's status after check-out
    setTimeout(() => {
        loadTodayStatus();
        // Also refresh overview if it's active
        if (document.getElementById('overview-page').classList.contains('active')) {
            loadAttendanceRecords('all');
        }
    }, 1000);
}

// Initialize dashboard
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        loadUserProfile();
        initNavigation();
        initSidebarActions();
        initAttendancePageButtons();
        initCalendar();
        initClock();
        
        // Load overview page by default
        switchPage('overview');
    });
}

// Initialize Calendar
function initCalendar() {
    renderCalendar(new Date());
}

// Render Calendar
function renderCalendar(date) {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    
    let html = `
        <div class="calendar-header">
            <button class="calendar-nav-btn" onclick="changeMonth(-1)">‹</button>
            <div class="calendar-month-year">${monthNames[month]} ${year}</div>
            <button class="calendar-nav-btn" onclick="changeMonth(1)">›</button>
        </div>
        <div class="calendar-weekdays">
    `;
    
    dayNames.forEach(day => {
        html += `<div class="calendar-weekday">${day}</div>`;
    });
    
    html += '</div><div class="calendar-days">';
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div class="calendar-day other-month"></div>';
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dayOfWeek = currentDate.getDay();
        const isOffDay = dayOfWeek === 0 || dayOfWeek === 2; // Sunday (0) or Tuesday (2)
        const isToday = isCurrentMonth && day === today.getDate();
        
        let classes = 'calendar-day';
        if (isOffDay) classes += ' off-day';
        if (isToday) classes += ' today';
        
        html += `<div class="${classes}">${day}</div>`;
    }
    
    // Fill remaining cells
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let i = 0; i < remainingCells && totalCells + i < 42; i++) {
        html += '<div class="calendar-day other-month"></div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Change Month
let currentCalendarDate = new Date();
function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar(currentCalendarDate);
}

// Initialize Clock
function initClock() {
    const canvas = document.getElementById('clockCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let radius = canvas.height / 2;
    ctx.translate(radius, radius);
    radius = radius * 0.90;
    
    // Store radius in canvas for use in draw functions
    canvas.radius = radius;
    
    updateClock();
    setInterval(() => {
        drawClock(ctx, radius);
        updateClock();
    }, 1000);
    
    // Initial draw
    drawClock(ctx, radius);
}

// Draw Clock Face
function drawFace(ctx, radius) {
    // Light green shadow/glow behind the clock
    ctx.shadowColor = 'rgba(102, 255, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Single circle with light green background (low opacity) - same as shadow color
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(102, 255, 0, 0.15)'; // Light green with low opacity - same as shadow
    ctx.fill();
    
    // Reset shadow for border
    ctx.shadowBlur = 0;
    
    // Subtle border in light gray
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Center circle with light green (low opacity) - same as shadow color
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(102, 255, 0, 0.3)'; // Light green with low opacity - same as shadow
    ctx.fill();
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Draw Numbers
function drawNumbers(ctx, radius) {
    ctx.font = "bold " + radius * 0.15 + "px arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = '#FFFFFF'; // White color for numbers
    
    for (let num = 1; num < 13; num++) {
        let ang = num * Math.PI / 6;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.85);
        ctx.rotate(-ang);
        ctx.fillText(num.toString(), 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 0.85);
        ctx.rotate(-ang);
    }
}

// Draw Time Hands
function drawTime(ctx, radius) {
    const now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();
    
    // Hour hand - darker gray for prominence (darker than before but not black)
    hour = hour % 12;
    hour = (hour * Math.PI / 6) + (minute * Math.PI / (6 * 60)) + (second * Math.PI / (360 * 60));
    drawHand(ctx, hour, radius * 0.5, radius * 0.07, '#1a1a1a'); // Darker gray hour hand
    
    // Minute hand - darker gray for prominence (darker than before but not black)
    minute = (minute * Math.PI / 30) + (second * Math.PI / (30 * 60));
    drawHand(ctx, minute, radius * 0.8, radius * 0.07, '#1a1a1a'); // Darker gray minute hand
    
    // Second hand - accent color (lime green)
    second = (second * Math.PI / 30);
    drawHand(ctx, second, radius * 0.9, radius * 0.02, '#66FF00'); // Lime green second hand
}

// Draw Hand
function drawHand(ctx, pos, length, width, color) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.moveTo(0, 0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-pos);
}

// Draw Complete Clock
function drawClock(ctx, radius) {
    ctx.clearRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);
    drawFace(ctx, radius);
    drawNumbers(ctx, radius);
    drawTime(ctx, radius);
}

// Update Digital Clock Display
function updateClock() {
    const clockTime12h = document.getElementById('clock-time-12h');
    const clockDate = document.getElementById('clock-date');
    
    if (!clockTime12h || !clockDate) return;
    
    const now = new Date();
    
    // Get time components
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    // Format time (12-hour format with AM/PM)
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');
    clockTime12h.textContent = `${hoursStr}:${minutesStr}:${secondsStr} ${ampm}`;
    
    // Format date
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = dayNames[now.getDay()];
    const monthName = monthNames[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    
    clockDate.textContent = `${dayName}, ${monthName} ${day}, ${year}`;
}
