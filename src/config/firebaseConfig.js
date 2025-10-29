import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAkVEEY7ftlqLEijPY6UaED2TqvX_E-g78",
  authDomain: "almacaninamobileoficial.firebaseapp.com",
  projectId: "almacaninamobileoficial",
  storageBucket: "almacaninamobileoficial.firebasestorage.app",
  messagingSenderId: "1051345264225",
  appId: "1:1051345264225:web:3b65d4da14e02991765420",
  measurementId: "G-N2B3GCHPGJ"
};

const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { auth, db };