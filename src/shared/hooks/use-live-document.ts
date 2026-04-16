import { useEffect, useState, type DependencyList } from "react";
import {
  onSnapshot,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot
} from "firebase/firestore";

export function useLiveDocument<T>(
  buildRef: () => DocumentReference<DocumentData> | null,
  deps: DependencyList,
  mapper: (snapshot: DocumentSnapshot<DocumentData>) => T | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = buildRef();
    if (!ref) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(mapper(snapshot));
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, deps);

  return { data, loading, error };
}
