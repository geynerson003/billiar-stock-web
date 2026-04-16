import { useEffect, useState, type DependencyList } from "react";
import {
  onSnapshot,
  type CollectionReference,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot
} from "firebase/firestore";

export function useLiveCollection<T>(
  buildRef: () => Query<DocumentData> | CollectionReference<DocumentData> | null,
  deps: DependencyList,
  mapper: (snapshot: QueryDocumentSnapshot<DocumentData>) => T
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = buildRef();
    if (!ref) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.docs.map(mapper));
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
