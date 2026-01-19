// Check-In Function
async function handleCheckIn() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const user = getCurrentUser();
    if (!user) {
        alert('User not found. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(API_ENDPOINTS.checkIn, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                email: user.email
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAttendanceMessage('Check-in successful!', 'success');
            // Refresh attendance records
            setTimeout(() => {
                loadAttendanceRecords();
            }, 1000);
        } else {
            showAttendanceMessage(data.detail || 'Check-in failed.', 'error');
        }
    } catch (error) {
        showAttendanceMessage('Network error. Please try again.', 'error');
    }
}

// Check-Out Function
async function handleCheckOut() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const user = getCurrentUser();
    if (!user) {
        alert('User not found. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(API_ENDPOINTS.checkOut, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                email: user.email
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAttendanceMessage('Check-out successful!', 'success');
            // Refresh attendance records
            setTimeout(() => {
                loadAttendanceRecords();
            }, 1000);
        } else {
            showAttendanceMessage(data.detail || 'Check-out failed.', 'error');
        }
    } catch (error) {
        showAttendanceMessage('Network error. Please try again.', 'error');
    }
}

// Show attendance message
function showAttendanceMessage(message, type) {
    // Try overview page message div
    let messageDiv = document.getElementById('attendanceMessage');
    
    // If not found, try attendance page message div
    if (!messageDiv) {
        messageDiv = document.getElementById('attendanceMessageAttendance');
    }
    
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `attendance-message show ${type}`;
        
        setTimeout(() => {
            messageDiv.classList.remove('show');
        }, 5000);
    }
}

// Initialize attendance buttons
if (document.getElementById('checkInBtn')) {
    document.getElementById('checkInBtn').addEventListener('click', handleCheckIn);
}

if (document.getElementById('checkOutBtn')) {
    document.getElementById('checkOutBtn').addEventListener('click', handleCheckOut);
}
