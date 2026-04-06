/* script.js */

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

// Firebase Database URL
const dbURL = "https://examination-bell-default-rtdb.asia-southeast1.firebasedatabase.app/";

// 🔐 PROTECT DASHBOARD
auth.onAuthStateChanged((user) => {
  if (!user && window.location.pathname.includes("dashboard")) {
    alert("Please login first");
    window.location.href = 'index.html';
  }
});

// 🔑 LOGIN FUNCTION
function login() {
  console.log("Login clicked");

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
      console.error(error);
      alert("Error: " + error.message);
    });
}

// 🕒 SHOW CURRENT TIME
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const el = document.getElementById('currentTime');
  if (el) el.innerText = 'Current Time: ' + timeString;
}
setInterval(updateTime, 1000);

// 🔔 SET BELL TIME (AUTO)
function setBellTime() {
  const hour = document.getElementById('hour').value;
  const minute = document.getElementById('minute').value;

  if (hour === '' || minute === '') {
    alert('Enter valid time');
    return;
  }

  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  fetch(dbURL + "bellTime.json", {
    method: "PUT",
    body: JSON.stringify(time)
  })
  .then(() => {
    alert("Bell time set: " + time);
  })
  .catch((err) => {
    alert("Error: " + err);
  });
}

// 🔘 MANUAL BELL BUTTON
function ringBell() {
  fetch(dbURL + "manualBell.json", {
    method: "PUT",
    body: JSON.stringify("ON")
  })
  .then(() => {
    alert("Bell Triggered 🔔");
  })
  .catch((err) => {
    alert("Error: " + err);
  });
}

// 🚪 LOGOUT FUNCTION
function logout() {
  auth.signOut().then(() => {
    alert("Logged out");
    window.location.href = 'index.html';
  });
}