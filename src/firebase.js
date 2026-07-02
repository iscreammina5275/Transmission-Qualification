import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBMPi0ge7HGdfH40ZSncFdrG-XuRIOYvsc",
  authDomain: "transmission-qualification.firebaseapp.com",
  databaseURL: "https://transmission-qualification-default-rtdb.firebaseio.com",
  projectId: "transmission-qualification",
  storageBucket: "transmission-qualification.firebasestorage.app",
  messagingSenderId: "130596297479",
  appId: "1:130596297479:web:91dc5389d87023447983a2",
  measurementId: "G-QB7LS6X34X",
};

export const isConfigured = true;

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
