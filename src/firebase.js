// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCOpAKOC521UdLrlnxhvSQVfK3lwU1Dtks",
  authDomain: "eduquest-74bfa.firebaseapp.com",
  projectId: "eduquest-74bfa",
  storageBucket: "eduquest-74bfa.firebasestorage.app",
  messagingSenderId: "21045199981",
  appId: "1:21045199981:web:7db4b832a382dd9005ab64",
  measurementId: "G-7CPTVXGTYV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
