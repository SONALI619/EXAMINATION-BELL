// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB1lUxJblKcUb0qP8xMluW4lThGOo5hkOA",
  authDomain: "examination-bell.firebaseapp.com",
  projectId: "examination-bell",
  storageBucket: "examination-bell.firebasestorage.app",
  messagingSenderId: "716899286222",
  appId: "1:716899286222:web:2fb0e7ec0b7252ba52649f"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();


// RESET UI 
function resetUI() {
  document.getElementById("scheduleList").innerHTML = "";
  document.getElementById("nextBell").innerText = "⏰ Next Bell: --";
  document.getElementById("examTimeDisplay").innerText = "Exam Start: --:--";
}

// AUTH
auth.onAuthStateChanged((user) => {
  if (!user && window.location.pathname.includes("dashboard")) {
    alert("Please login first");
    window.location.href = 'index.html';
  }
});

// LOGIN
function login() {
  const email = document.getElementById('email-id').value;
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert("Enter email & password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login Successful ✅");
      window.location.href = 'dashboard.html';
    })
    .catch(err => alert(err.message));
}

//CURRENT TIME
function updateTime() {
  const now = new Date();

  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false   // 🔥 24 hour format
  });

  document.getElementById('currentTime').innerText =
    'Current Time: ' + timeString;
}
setInterval(updateTime, 1000);

//SET EXAM TIME
function setExamTime() {
  let hour = document.getElementById('hour').value;
  let minute = document.getElementById('minute').value;

  if (hour === '' || minute === '') {
    alert('Enter valid time');
    return;
  }

  const time = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;

  console.log("Sending time:", time);

  fetch("https://examination-bell-default-rtdb.asia-southeast1.firebasedatabase.app/bellTime.json", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(time)
  })
  .then(() => {
    alert("Exam time set: " + time);

    // update UI
    generateSchedule(parseInt(hour), parseInt(minute));
  })
  .catch(err => {
    console.error(err);
    alert("Error: " + err);
  });
}

// GENERATE SCHEDULE 
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

    let h = Math.floor(e.time / 60);
    let m = e.time % 60;

    if (m < 0) m += 60;
    if (h < 0) h += 24;

    h = h % 24;

    const timeStr =
      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

    const li = document.createElement("li");
    li.innerText = `${e.name} → ${timeStr}`;
    list.appendChild(li);
  });

  document.getElementById("examTimeDisplay").innerText =
    "Exam Start: " +
    `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
}

// LOAD FROM FIREBASE
function loadExamTime() {

  db.ref("bellTime").on("value", (snapshot) => {

    const time = snapshot.val();

    if (!time) {
      resetUI();
      return;
    }

    const [h, m] = time.split(":").map(Number);

    if (isNaN(h) || isNaN(m)) {
      resetUI();
      return;
    }

    generateSchedule(h, m);

    document.getElementById("examTimeDisplay").innerText =
      `Exam Start: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  });
}
// NEXT BELL
function updateNextBell() {

  const nextBellEl = document.getElementById("nextBell");

  fetch("https://examination-bell-default-rtdb.asia-southeast1.firebasedatabase.app/bellTime.json")
    .then(res => res.json())
    .then(time => {

      if (!time) {
        nextBellEl.innerText = "⏰ Next Bell: --";
        return;
      }

      const [h, m] = time.split(":").map(Number);

      if (isNaN(h) || isNaN(m)) {
        nextBellEl.innerText = "⏰ Next Bell: --";
        return;
      }

      const now = new Date();
      const currentSec =
        now.getHours() * 3600 +
        now.getMinutes() * 60 +
        now.getSeconds();

      const base = h * 3600 + m * 60;

      const events = [
        { name: "📢 Entering Bell", offset: -900 },
        { name: "📝 Exam Start", offset: 0 },
        { name: "⏱ 1 Hour Complete", offset: 3600 },
        { name: "⏱ 2 Hour Complete", offset: 7200 },
        { name: "🏁 Exam End", offset: 10800 }
      ];

      let nextEvent = null;
      let minDiff = Infinity;

      events.forEach(e => {

        let eventTime = (base + e.offset + 86400) % 86400;
        let diff = eventTime - currentSec;

        if (diff < 0) diff += 86400;

        if (diff < minDiff) {
          minDiff = diff;
          nextEvent = { ...e, time: eventTime };
        }
      });

      if (nextEvent) {
        const hh = Math.floor(nextEvent.time / 3600);
        const mm = Math.floor((nextEvent.time % 3600) / 60);

        nextBellEl.innerText =
          `${nextEvent.name} at ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
      }

    })
    .catch(() => {
      nextBellEl.innerText = "⏰ Next Bell: --";
    });
}
// MANUAL BELL 
function ringBell() {

  fetch("https://examination-bell-default-rtdb.asia-southeast1.firebasedatabase.app/manualBell.json", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify("ON")   // 🔥 IMPORTANT
  })
  .then(() => {
    alert("Bell Triggered 🔔");
  })
  .catch(err => {
    console.error(err);
    alert("Error: " + err);
  });

}
// RESET BUTTON 
function clearExamTime() {

  fetch("https://examination-bell-default-rtdb.asia-southeast1.firebasedatabase.app/bellTime.json", {
    method: "DELETE"
  })
  .then(() => {
    resetUI();   // instantly clear UI
  })
  .catch(err => alert(err));
}
// LOGOUT 
function logout() {
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
}

// PAGE LOAD
window.onload = function () {

  resetUI();
  loadExamTime();

  setInterval(updateNextBell, 10000);
};