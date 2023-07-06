// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';

// Add the Firebase products and methods that you want to use
import {} from 'firebase/auth';
import { getAuth, EmailAuthProvider,  signOut,
  onAuthStateChanged } from 'firebase/auth';
import {getFirestore,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  where} from 'firebase/firestore';

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');
const items= document.getElementById('items');
const form2= document.getElementById('add-item');
const item=document.getElementById('item');
const itemColor=document.getElementById('itemColor');
const itemSize=document.getElementById('itemSize');
const itemBrand=document.getElementById('itemBrand');
const itemQuantity=document.getElementById('itemQuantity');
let itemsListener=null;
let rsvpListener = null;
let guestbookListener = null;

let db, auth;

async function main() {
  // Add Firebase project configuration object here
  const firebaseConfig = {
    apiKey: "AIzaSyBXzN23t0AA4l9RzqpPPHdl4CpaUOMyBHY",
    authDomain: "fir-web-codelab-c6333.firebaseapp.com",
    projectId: "fir-web-codelab-c6333",
    storageBucket: "fir-web-codelab-c6333.appspot.com",
    messagingSenderId: "1032954459063",
    appId: "1:1032954459063:web:8a3e8e440ced5df57f2e32",
    measurementId: "G-0EB9DE3DG5"
  };

  // Initialize Firebase
  initializeApp(firebaseConfig);
  auth = getAuth();
  db = getFirestore();
  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      },
    },
  };

  const ui = new firebaseui.auth.AuthUI(auth);
  // Listen to RSVP button clicks
// Called when the user clicks the RSVP button
  startRsvpButton.addEventListener('click', () => {
    if (auth.currentUser) {
      // User is signed in; allows user to sign out
      signOut(auth);
    } else {
      // No user is signed in; allows user to sign in
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });
// Listen to the current Auth state
onAuthStateChanged(auth, user => {
  if (user) {
    startRsvpButton.textContent = 'LOGOUT';
    // Show guestbook to logged-in users
    guestbookContainer.style.display = 'block';
    // Subscribe to the guestbook collection
    subscribeGuestbook();
    // Subcribe to the user's RSVP
    subscribeCurrentRSVP(user);
    // Subscribe to the items collection
    subscribeItems();
  } else {
    startRsvpButton.textContent = 'RSVP';
    // Hide guestbook for non-logged-in users
    guestbookContainer.style.display = 'none';
    // Unsubscribe from the guestbook collection
    unsubscribeGuestbook();
     // Unsubscribe from the user's RSVP
    unsubscribeCurrentRSVP();
    // Unsubscribe from the items collection
    unsubscribeItems();
  }
});
  // Listen to the form submission
  form.addEventListener('submit', async e => {
    // Prevent the default form redirect
    e.preventDefault();
    if(input.value!='') {
      // Write a new message to the database collection "guestbook"
      addDoc(collection(db, 'guestbook'), {
        text: input.value,
        timestamp: Date.now(),
        name: auth.currentUser.displayName,
        userId: auth.currentUser.uid
      });
    }
    // clear message input field
    input.value = '';
    // Return false to avoid redirect
    return false;
  });
  // Create query for messages
  const q = query(collection(db, 'guestbook'), orderBy('timestamp', 'desc'));
  onSnapshot(q, snaps => {
    // Reset page
    guestbook.innerHTML = '';
    // Loop through documents in database
    snaps.forEach(doc => {
      // Create an HTML entry for each document and add it to the chat
      const entry = document.createElement('p');
      entry.textContent = doc.data().name + ': ' + doc.data().text;
      guestbook.appendChild(entry);
    });
  });
  // Listen to RSVP responses
  rsvpYes.onclick = async () => {
    // Get a reference to the user's document in the attendees collection
    const userRef = doc(db, 'attendees', auth.currentUser.uid);
  
    // If they RSVP'd yes, save a document with attendi()ng: true
    try {
      await setDoc(userRef, {
        attending: true
      });
    } catch (e) {
      console.error(e);
    }
  };
  rsvpNo.onclick = async () => {
    // Get a reference to the user's document in the attendees collection
    const userRef = doc(db, 'attendees', auth.currentUser.uid);
  
    // If they RSVP'd yes, save a document with attending: true
    try {
      await setDoc(userRef, {
        attending: false
      });
    } catch (e) {
      console.error(e);
    }
  };
  // Listen for attendee list
  const attendingQuery = query(
    collection(db, 'attendees'),
    where('attending', '==', true)
  );
  const unsubscribe = onSnapshot(attendingQuery, snap => {
    const newAttendeeCount = snap.docs.length;
    numberAttending.innerHTML = newAttendeeCount + ' people going';
  });
  // Listen to the form submission
  form2.addEventListener('submit', async e => {
    // Prevent the default form redirect
    e.preventDefault();
    if(item.value!='') {
      // Write a new item to the database collection "items"
      addDoc(collection(db, 'items'), {
        text: item.value,
        color: itemColor.value,
        size: itemSize.value,
        brand:itemBrand.value,
        quantity:itemQuantity.value,
        timestamp: Date.now(),
        name: auth.currentUser.displayName,
        userId: auth.currentUser.uid
      });
    }
    // clear message input field
    item.value = '';
    itemColor.value = '';
    itemSize.value = '';
    itemBrand.value='';
    itemQuantity.value='';
    // Return false to avoid redirect
    return false;
  });
  // Create query for messages
  const q2 = query(collection(db, 'items'), orderBy('timestamp', 'desc'));
  onSnapshot(q2, snaps => {
    // Reset page
    items.innerHTML = '';
    // Loop through documents in database
    snaps.forEach(doc => {
      // Create an HTML entry for each document and add it to the chat
      const entry = document.createElement('p');
      entry.textContent = doc.data().name + ': ' + doc.data().text;
      items.appendChild(entry);
    });
  });
}
// Listen to guestbook updates
function subscribeGuestbook() {
  const q = query(collection(db, 'guestbook'), orderBy('timestamp', 'desc'));
  guestbookListener = onSnapshot(q, snaps => {
    // Reset page
    guestbook.innerHTML = '';
    // Loop through documents in database
    snaps.forEach(doc => {
      // Create an HTML entry for each document and add it to the chat
      const entry = document.createElement('p');
      entry.textContent = doc.data().name + ": " + doc.data().text;
      guestbook.appendChild(entry);
    });
  });
}
// Unsubscribe from guestbook updates
function unsubscribeGuestbook() {
  if (guestbookListener != null) {
    guestbookListener();
    guestbookListener = null;
  }
}
// Listen to items updates
function subscribeItems() {
  const q2 = query(collection(db, 'items'), where("userId","==",auth.currentUser.uid));
  itemsListener = onSnapshot(q2, snaps => {
    // Reset page
    items.innerHTML = '';
    // Loop through documents in database
    snaps.forEach(doc => {
        // Create an HTML entry for each document and add it to the chat
        const entry = document.createElement('p');
        entry.textContent = doc.data().name + '--> ';
        if (doc.data().size!=null) {
          entry.textContent+=doc.data().size + ' ';
        }
        if (doc.data().brand!=null) {
          entry.textContent+=doc.data().brand + ' ';
        } 
        if (doc.data().color!=null) {
          entry.textContent+=doc.data().color + ' ';
        } 
        entry.textContent+=doc.data().text;
        if (doc.data().quantity!=null) {
          entry.textContent+=', Quantity: ' + doc.data().quantity;
        }
        items.appendChild(entry);
    });
  });
}
// Unsubscribe from items updates
function unsubscribeItems() {
  if (itemsListener != null) {
    itemsListener();
    itemsListener = null;
  }
}
// Listen for attendee list
function subscribeCurrentRSVP(user) {
  const ref = doc(db, 'attendees', user.uid);
  rsvpListener = onSnapshot(ref, doc => {
    if (doc && doc.data()) {
      const attendingResponse = doc.data().attending;

      // Update css classes for buttons
      if (attendingResponse) {
        rsvpYes.className = 'clicked';
        rsvpNo.className = '';
      } else {
        rsvpYes.className = '';
        rsvpNo.className = 'clicked';
      }
    }
  });
}
function unsubscribeCurrentRSVP() {
  if (rsvpListener != null) {
    rsvpListener();
    rsvpListener = null;
  }
  rsvpYes.className = '';
  rsvpNo.className = '';
}
main();
