import { call, put, takeLatest } from "redux-saga/effects";
import { SagaIterator } from "redux-saga";
import axios from "axios";
import {
  loadDesignFailure,
  loadDesignRequest,
  loadDesignSuccess,
  saveDesignFailure,
  saveDesignRequest,
  saveDesignSuccess,
} from "../features/designSlice";
import { applyCustomDesign } from "../features/categorySlice";
import { SavedDesign, SharedDesign } from "@/app/types/design";

// Both endpoints are public (no login needed) — anyone can save and open designs.
const BASE = () => `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/essentials/designs`;

function saveDesignCall(design: SharedDesign) {
  return axios.post<{ id: string }>(BASE(), design).then((response) => response.data);
}

function loadDesignCall(id: string) {
  return axios
    .get<SavedDesign>(`${BASE()}/${encodeURIComponent(id)}`)
    .then((response) => response.data);
}

// The server's own message is safe to show for these (rate limit, validation);
// anything else gets a generic sentence — never a raw error or stack.
function saveErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if ((status === 429 || status === 400) && message) return message;
  }
  return "We couldn't save your design. Please try again.";
}

function* handleSaveDesign(action: ReturnType<typeof saveDesignRequest>): SagaIterator {
  try {
    const { id }: { id: string } = yield call(saveDesignCall, action.payload.design);
    yield put(
      saveDesignSuccess({
        id,
        categorySlug: action.payload.design.categorySlug,
        signature: action.payload.signature,
      }),
    );
  } catch (error) {
    yield put(saveDesignFailure(saveErrorMessage(error)));
  }
}

function* handleLoadDesign(action: ReturnType<typeof loadDesignRequest>): SagaIterator {
  try {
    const design: SavedDesign = yield call(loadDesignCall, action.payload.id);
    if (design.categorySlug !== action.payload.categorySlug) {
      yield put(
        loadDesignFailure("That design is for a different type of room, so it can't be opened here."),
      );
      return;
    }
    yield put(applyCustomDesign(design));
    yield put(loadDesignSuccess());
  } catch (error) {
    const notFound = axios.isAxiosError(error) && error.response?.status === 404;
    yield put(
      loadDesignFailure(
        notFound
          ? "We couldn't find that shared design. The link may be wrong or may have expired."
          : "We couldn't open that shared design right now. Please try again.",
      ),
    );
  }
}

export function* watchDesigns(): SagaIterator {
  yield takeLatest(saveDesignRequest.type, handleSaveDesign);
  yield takeLatest(loadDesignRequest.type, handleLoadDesign);
}
