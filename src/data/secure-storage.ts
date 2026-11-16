// Metro chooses secure-storage.native.ts on iOS/Android.
import AsyncStorage from '@react-native-async-storage/async-storage';
export const sessionStorage = AsyncStorage;
