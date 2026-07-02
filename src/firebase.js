import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// ⚠️ Firebase 설정 필요
// console.firebase.google.com → 프로젝트 생성 → Realtime Database 활성화 →
// 프로젝트 설정 → 웹 앱 추가 → 아래 값을 본인 프로젝트 값으로 교체하세요

const firebaseConfig = {
  apiKey: "PLACEHOLDER",
  authDomain: "PLACEHOLDER.firebaseapp.com",
  databaseURL: "https://PLACEHOLDER-default-rtdb.firebaseio.com",
  projectId: "PLACEHOLDER",
  storageBucket: "PLACEHOLDER.appspot.com",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER",
};

export const isConfigured = !firebaseConfig.apiKey.includes("PLACEHOLDER");

export let db = null;

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (e) {
    console.error("Firebase 초기화 오류:", e);
  }
}
