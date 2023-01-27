import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

import { uploadApi, UploadFileResponse } from "../data/uploadApi";

import { hashFile } from "../helpers/files";
import { generatePreviewBlobUrl } from "../helpers/images";

import {
  createTypedAsyncThunk,
  startTypedListening,
} from "../store/middleware";

export interface UploadItem {
  assetType: "image" | "file" | "video";
  hash: string;
  name: string;
  size: number;
  status: "queued" | "uploading" | "complete";
  url?: string;
  percent?: number;
  folder?: string;
}

export interface UploadState {
  currentUploads: Record<string, Record<string, UploadItem>>;
}

const initialState: UploadState = {
  currentUploads: {},
};

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    previewReady(
      state,
      action: PayloadAction<{
        hash: string;
        previewUrl: string;
        folder: string;
      }>
    ) {
      const { hash, previewUrl, folder } = action.payload;
      state.currentUploads[folder][hash].url = previewUrl;
      state.currentUploads[folder][hash].status = "uploading";
    },
    uploadStart(state, action: PayloadAction<UploadItem>) {
      const { folder, hash } = action.payload;
      state.currentUploads[folder!][hash] = action.payload;
    },
    createFolderInCurrentUploads(state, action: PayloadAction<string>) {
      const folder = action.payload;
      state.currentUploads[folder] = {};
    },
    deleteUploadItems(state, action: PayloadAction<UploadItem[]>) {
      action.payload.forEach(({ name, folder }) => {
        if (!folder) {
          return;
        }

        Object.entries(state.currentUploads[folder]).forEach(([hash, item]) => {
          if (item.name === name) {
            delete state.currentUploads[folder][hash];
          }
        });
      });
    },
  },
  extraReducers(builder) {
    builder.addCase(uploadAssetThunk.rejected, (state, action) => {
      const { folder } = action.meta.arg;

      Object.entries(state.currentUploads[folder]).forEach(([hash, item]) => {
        if (item.name === action.meta.arg.file.name) {
          delete state.currentUploads[folder][hash];
        }
      });
      // TODO: show error message in the console.
    });
    builder.addCase(uploadAssetThunk.fulfilled, (state, action) => {
      if ("data" in action.payload) {
        const { data } = action.payload;
        let { hash, folderPath } = data;

        if (folderPath === "/") {
          folderPath = "root";
        }

        if (
          state.currentUploads[folderPath] &&
          state.currentUploads[folderPath][hash]
        ) {
          state.currentUploads[folderPath][hash].status = "complete";
        }
      }
    });
  },
});

export const uploadReducer = uploadSlice.reducer;

const { previewReady, uploadStart, createFolderInCurrentUploads } =
  uploadSlice.actions;

export const { deleteUploadItems } = uploadSlice.actions;

const UPLOAD_FILE_THUNK = "upload/asset";

export const uploadAssetThunk = createTypedAsyncThunk<
  { data: UploadFileResponse } | { error: unknown },
  { file: File; folder: string }
>(
  UPLOAD_FILE_THUNK,
  async ({ file, folder }, { getState, dispatch, signal }) => {
    const source = axios.CancelToken.source();

    signal.addEventListener("abort", () => {
      // This will then trigger the `uploadAssetThunk.rejected` case.
      source.cancel();
    });

    const hash = await hashFile(file);

    const currentUploadsForFolder = getState().upload.currentUploads[folder];

    if (currentUploadsForFolder && currentUploadsForFolder[hash]) {
      return { error: "File already exists" };
    } else if (!currentUploadsForFolder) {
      dispatch(createFolderInCurrentUploads(folder));
    }

    /**
     * We distinguish between images and files because we want to be able to support
     * an image pipeline in the future.
     */
    const assetType =
      file.type.indexOf("image") >= 0
        ? "image"
        : file.type.indexOf("video") >= 0
        ? "video"
        : "file";

    const uploadItem: UploadItem = {
      assetType,
      hash,
      name: file.name,
      size: file.size,
      status: "queued",
      folder,
    };

    /**
     * Setup the upload item in the store
     */
    dispatch(uploadStart(uploadItem));

    const previewUrl = await generatePreviewBlobUrl(file);

    /**
     * Add a preview version of the URL for now to the store
     */
    dispatch(previewReady({ hash, previewUrl, folder }));

    /**
     * DEBUG
     */
    await new Promise<void>((res) => {
      setTimeout(() => {
        res();
      }, 5000);
    });

    const uploadAction = await dispatch(
      uploadApi.endpoints.uploadFile.initiate({
        file,
        fileInfo: {
          assetType,
          hash,
          folder: folder === "root" ? "/" : folder,
        },
        cancelToken: source.token,
      })
    );

    if ("error" in uploadAction) {
      throw new Error("Upload failed");
    }

    return uploadAction;
  }
);
