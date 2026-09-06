const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldUseStore = `function useStore(key, initial) {
  const [val, setVal] = useState(() => {
    const stored = readStore(key, undefined);
    return stored === undefined ? initial : stored;
  });
  useEffect(() => {
    if (key === 'isAdmin') return;
    const unsub = onSnapshot(doc(firestoreDB, 'zwanan', key), (snap) => {
      if (snap.exists()) {
        setVal(snap.data());
        writeStore(key, snap.data());
      } else {
        setDoc(doc(firestoreDB, 'zwanan', key), initial).catch(console.error);
      }
    });
    return unsub;
  }, [key]);
  const setValFirebase = useCallback((updater) => {
    setVal((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (key !== 'isAdmin') {
         setDoc(doc(firestoreDB, 'zwanan', key), next).catch(console.error);
      }
      writeStore(key, next);
      return next;
    });
  }, [key]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === NS + key) {
        try { setVal(e.newValue == null ? initial : JSON.parse(e.newValue)); } catch (err) { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key, initial]);
  return [val, setValFirebase];
}`;

const newUseStore = `function useStore(key, initial) {
  const [val, setVal] = useState(() => {
    const stored = readStore(key, undefined);
    return stored === undefined ? initial : stored;
  });
  useEffect(() => {
    if (key === 'isAdmin') return;
    const unsub = onSnapshot(doc(firestoreDB, 'zwanan', key), (snap) => {
      if (snap.exists()) {
        setVal(snap.data());
        writeStore(key, snap.data());
      } else {
        setDoc(doc(firestoreDB, 'zwanan', key), initial).catch((err) => handleFirestoreError(err, OperationType.WRITE, 'zwanan/' + key));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'zwanan/' + key);
    });
    return unsub;
  }, [key]);
  const setValFirebase = useCallback((updater) => {
    setVal((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (key !== 'isAdmin') {
         setDoc(doc(firestoreDB, 'zwanan', key), next).catch((err) => handleFirestoreError(err, OperationType.WRITE, 'zwanan/' + key));
      }
      writeStore(key, next);
      return next;
    });
  }, [key]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === NS + key) {
        try { setVal(e.newValue == null ? initial : JSON.parse(e.newValue)); } catch (err) { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key, initial]);
  return [val, setValFirebase];
}`;

content = content.replace(oldUseStore, newUseStore);
fs.writeFileSync('src/App.tsx', content);
