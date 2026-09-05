import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZYZeOF8oS9K-8hRqMsSrvBaCK9es6uWA",
  authDomain: "data-1-d387e.firebaseapp.com",
  projectId: "data-1-d387e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const querySnapshot = await getDocs(collection(db, "members"));
    console.log("Found", querySnapshot.size, "documents");
    for (const d of querySnapshot.docs) {
      const data = d.data();
      if (data.cnic && data.cnic.length > 5) {
        console.log("Deleting document:", d.id, "CNIC:", data.cnic);
        await deleteDoc(doc(db, "members", d.id));
      }
    }
    console.log("Done.");
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
