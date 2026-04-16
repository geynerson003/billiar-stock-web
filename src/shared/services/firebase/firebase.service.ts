/**
 * Firebase Service Wrapper
 * Centraliza todos los accesos a Firebase
 * Permite cambiar a otra BD sin modificar el código de features
 */

import { auth, db } from "./config";
import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
  Unsubscribe
} from "firebase/firestore";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User
} from "firebase/auth";

/**
 * Firebase Auth Service
 */
export class FirebaseAuthService {
  async login(email: string, password: string): Promise<User> {
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    return credentials.user;
  }

  async register(email: string, password: string): Promise<User> {
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    return credentials.user;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, callback);
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

/**
 * Firebase Firestore Service
 */
export class FirebaseFirestoreService {
  /**
   * Obtiene referencia a una colección del usuario
   */
  getBusinessCollection<T = DocumentData>(
    userId: string,
    collectionName: string
  ): CollectionReference<T> {
    return collection(db, "businesses", userId, collectionName) as CollectionReference<T>;
  }

  /**
   * Obtiene referencia a un documento específico del usuario
   */
  getBusinessDoc<T = DocumentData>(
    userId: string,
    collectionName: string,
    docId: string
  ): DocumentReference<T> {
    return doc(db, "businesses", userId, collectionName, docId) as DocumentReference<T>;
  }

  /**
   * Obtiene referencia al documento del usuario (users collection)
   */
  getUserDoc<T = DocumentData>(userId: string): DocumentReference<T> {
    return doc(db, "users", userId) as DocumentReference<T>;
  }

  /**
   * Obtiene referencia al documento del negocio (businesses collection)
   */
  getBusinessProfileDoc<T = DocumentData>(userId: string): DocumentReference<T> {
    return doc(db, "businesses", userId) as DocumentReference<T>;
  }

  /**
   * Escucha cambios en una colección
   */
  watchCollection<T>(
    ref: Query<DocumentData> | CollectionReference<DocumentData>,
    mapper: (snapshot: QueryDocumentSnapshot<DocumentData>) => T,
    onNext: (data: T[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      ref,
      (snapshot) => {
        onNext(snapshot.docs.map(mapper));
      },
      (error) => {
        if (onError) onError(error);
      }
    );
  }

  /**
   * Escucha cambios en un documento
   */
  watchDoc<T>(
    ref: DocumentReference<DocumentData>,
    mapper: (snapshot: DocumentSnapshot<DocumentData>) => T | null,
    onNext: (data: T | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      ref,
      (snapshot) => {
        onNext(mapper(snapshot));
      },
      (error) => {
        if (onError) onError(error);
      }
    );
  }

  /**
   * Obtiene un documento (una sola vez)
   */
  async getDoc<T = DocumentData>(ref: DocumentReference<T>): Promise<T | null> {
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? snapshot.data() : null;
  }

  /**
   * Obtiene todos los documentos de una colección (una sola vez)
   */
  async getCollection<T = DocumentData>(ref: CollectionReference<T>): Promise<T[]> {
    const snapshot = await getDocs(ref);
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * Ejecuta una query
   */
  async queryCollection<T = DocumentData>(
    ref: CollectionReference<T>,
    constraints: QueryConstraint[]
  ): Promise<T[]> {
    const q = query(ref, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * Crea o actualiza un documento
   */
  async setDoc<T = DocumentData>(ref: DocumentReference<T>, data: T): Promise<void> {
    await setDoc(ref, data);
  }

  /**
   * Actualiza un documento (merge)
   */
  async updateDoc<T = DocumentData>(ref: DocumentReference<T>, data: Partial<T>): Promise<void> {
    await updateDoc(ref, data);
  }

  /**
   * Elimina un documento
   */
  async deleteDoc(ref: DocumentReference): Promise<void> {
    await deleteDoc(ref);
  }

  /**
   * Ejecuta una transacción
   */
  async transaction<T>(
    updateFn: (transaction: any) => Promise<T>
  ): Promise<T> {
    return runTransaction(db, updateFn);
  }
}

// Exporta instancias singleton
export const firebaseAuthService = new FirebaseAuthService();
export const firebaseFirestoreService = new FirebaseFirestoreService();
