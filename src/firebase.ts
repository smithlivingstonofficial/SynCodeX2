import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCLvnhZcV0vQ-u5_Co64PaDovbWXaHym38",
    authDomain: "syncodex.firebaseapp.com",
    databaseURL: "https://syncodex-default-rtdb.firebaseio.com",
    projectId: "syncodex",
    storageBucket: "syncodex.appspot.com",
    messagingSenderId: "1054429357028",
    appId: "1:1054429357028:web:4233ddef8c4f3c9771ddf1"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);