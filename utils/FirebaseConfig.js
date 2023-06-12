// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBIq-pBEyKgSWF8YdSxd65ZJBu3ym9j7lM",
    authDomain: "oes-gencertificate.firebaseapp.com",
    projectId: "oes-gencertificate",
    storageBucket: "oes-gencertificate.appspot.com",
    messagingSenderId: "1078644939443",
    appId: "1:1078644939443:web:0ca313638080a427976ec6",
    measurementId: "G-L15162W57B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);