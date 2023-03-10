import {
  createAsyncThunk,
  createListenerMiddleware,
  type TypedStartListening,
} from '@reduxjs/toolkit';

import type { Dispatch, RootState } from './store';

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, Dispatch>;

export const startTypedListening = listenerMiddleware.startListening as AppStartListening;

export const createTypedAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: Dispatch;
}>();
