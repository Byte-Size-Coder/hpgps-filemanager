import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: 'AIzaSyCvzxaqfdtQ_M89dnhobRuTGuzRDrthoBE',
	authDomain: 'geotabfiles.firebaseapp.com',
	projectId: 'geotabfiles',
	storageBucket: 'geotabfiles.appspot.com',
	messagingSenderId: '642063970981',
	appId: '1:642063970981:web:07fd8df094ea3af7d5d34c',
	measurementId: 'G-360MV23GH3',
};

// Initialize Firebase
export const fbApp = initializeApp(firebaseConfig);
export const fbFirestore = getFirestore(fbApp);
export const fbStorage = getStorage(fbApp);
