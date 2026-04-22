// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB1lUxJblKcUb0qP8xMluW4lThGOo5hkOA",
  authDomain: "examination-bell.firebaseapp.com",
  projectId: "examination-bell",
  storageBucket: "examination-bell.firebasestorage.app",
  messagingSenderId: "716899286222",
  appId: "1:716899286222:web:2fb0e7ec0b7252ba52649f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ================= AUTH =================
auth.onAuthStateChanged((user) => {
  if (!user && window.location.pathname.includes("dashboard")) {
    alert("Please login first");
    window.location.href = 'index.html';
  }
});

// ================= LOGIN =================
function login() {
  const email = document.getElementById('email-id').value;
  const password = document.getElementById('password').value;

  if (email === "" || password === "") {
    alert("Please enter email and password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login Successful ✅");
      window.location.href = 'dashboard.html';
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
}

// ================= CURRENT TIME =================
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const el = document.getElementById('currentTime');
  if (el) el.innerText = 'Current Time: ' + timeString;
}
setInterval(updateTime, 1000);

// ================= SET EXAM TIME =================
function setExamTime() {
  let hour = parseInt(document.getElementById('hour').value);
  let minute = parseInt(document.getElementById('minute').value);
  const ampm = document.getElementById('ampm').value;

  if (isNaN(hour) || isNaN(minute)) {
    alert("Enter valid time");
    return;
  }

  // Convert to 24-hour
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  fetch("https://examination-bell-default-rtdb.asia-southeast1.firebasedatabase.app/bellTime.json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(time)
  })
  .then(() => {
    alert("Exam time set: " + time);

    // 🔥 UPDATE UI IMMEDIATELY
    generateSchedule(hour, minute);
  })
  .catch(err => alert("Error: " + err));
}

// ================= GENERATE SCHEDULE =================
function generateSchedule(hour, minute) {

  const base = hour * 60 + minute;

  const events = [
    { name: "📢 Entering Bell", time: base - 15 },
    { name: "📝 Exam Start", time: base },
    { name: "⏱ 1 Hour Complete", time: base + 60 },
    { name: "⏱ 2 Hour Complete", time: base + 120 },
    { name: "🏁 Exam End", time: base + 180 }
  ];

  const list = document.getElementById("scheduleList");
  if (!list) return;

  list.innerHTML = "";

  events.forEach(e => {
    const h = (Math.floor(e.time / 60) + 24) % 24;
    const m = (e.time % 60 + 60) % 60;

    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const li = document.createElement("li");
    li.innerText = `${e.name} → ${timeStr}`;
    list.appendChild(li);
  });

  document.getElementById("examTimeDisplay").innerText =
    "Exam Start: " + `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ================= LOAD DATA ON PAGE LOAD =================
function loadExamTime() {
  fetch("https://examination-bell-default-rtdb.asia-southeast1.firebasedatabase.app/bellTime.json")
    .then(res => res.json())
    .then(time => {

      if (!time) return;

      const [h, m] = time.split(":").map(Number);

      // 🔥 IMPORTANT
      generateSchedule(h, m);

    });
}

window.onload = loadExamTime;

// ================= NEXT BELL =================
function updateNextBell() {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  fetch("https://examination-bell-default-rtdb.asia-southeast1.firebasedatabase.app/bellTime.json")
    .then(res => res.json())
    .then(time => {

      if (!time) return;

      const [h, m] = time.split(":").map(Number);
      const base = h * 60 + m;

      const events = [
        { name: "Entering Bell", time: base - 15 },
        { name: "Exam Start", time: base },
        { name: "1 Hour Complete", time: base + 60 },
        { name: "2 Hour Complete", time: base + 120 },
        { name: "Exam End", time: base + 180 }
      ];

      for (let e of events) {
        if (e.time > currentMin) {
          const hh = (Math.floor(e.time / 60) + 24) % 24;
          const mm = (e.time % 60 + 60) % 60;

          document.getElementById("nextBell").innerText =
            `${e.name} at ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
          return;
        }
      }

      document.getElementById("nextBell").innerText = "All bells completed ✅";
    });
}

setInterval(updateNextBell, 5000);

// ================= MANUAL BELL =================
function ringBell() {
  fetch("https://examination-bell-default-rtdb.asia-southeast1.firebasedatabase.app/manualBell.json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify("ON")
  })
  .then(() => alert("Bell Triggered 🔔"))
  .catch(err => alert("Error: " + err));
}

// ================= LOGOUT =================
function logout() {
  auth.signOut().then(() => {
    alert("Logged out");
    window.location.href = 'index.html';
  });
}