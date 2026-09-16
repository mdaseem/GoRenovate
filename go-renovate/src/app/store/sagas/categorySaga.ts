import { call, put, takeLatest } from "redux-saga/effects";
import { SagaIterator } from "redux-saga";
import axios from "axios";
import {
  getCategories,
  setCategories,
  setCategoriesError,
  getCategoryDetail,
  setCategoryDetail,
  setCategoryDetailError,
  getRoomGrid,
  setRoomGrid,
  setRoomGridError,
} from "../features/categorySlice";
import {
  Category,
  CategoryDetail,
  Room,
} from "@/app/types/category";

// GET /essentials/categories* is public — no auth token needed, matching
// how vendorDetailRoutes.ts (/vendors) is mounted with no requireAuth.
function getCategoriesCall() {
  return axios
    .get<Category[]>(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/essentials/categories`,
    )
    .then((response) => response.data);
}

function getCategoryDetailCall(slug: string) {
  return axios
    .get<CategoryDetail>(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/essentials/categories/${slug}`,
    )
    .then((response) => response.data);
}

function getRoomGridCall(categorySlug: string, queryString: string) {
  // The Room grid reuses the category-detail endpoint with style/price
  // filters — it already returns `rooms: Room[]` filtered server-side.
  const query = queryString ? `?${queryString}` : "";
  return axios
    .get<CategoryDetail>(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/essentials/categories/${categorySlug}${query}`,
    )
    .then((response) => response.data.rooms);
}

function* handleGetCategories(): SagaIterator {
  try {
    const categories: Category[] = yield call(getCategoriesCall);
    yield put(setCategories(categories));
  } catch {
    yield put(
      setCategoriesError("We couldn't load categories. Please try again."),
    );
  }
}

function* handleGetCategoryDetail(
  action: ReturnType<typeof getCategoryDetail>,
): SagaIterator {
  try {
    const detail: CategoryDetail = yield call(
      getCategoryDetailCall,
      action.payload.slug,
    );
    yield put(setCategoryDetail(detail));
  } catch {
    yield put(
      setCategoryDetailError(
        "We couldn't load this category. Please try again.",
      ),
    );
  }
}

function* handleGetRoomGrid(
  action: ReturnType<typeof getRoomGrid>,
): SagaIterator {
  try {
    const rooms: Room[] = yield call(
      getRoomGridCall,
      action.payload.categorySlug,
      action.payload.queryString,
    );
    yield put(
      setRoomGrid({ data: rooms, isUnfiltered: action.payload.isUnfiltered }),
    );
  } catch {
    yield put(
      setRoomGridError("We couldn't load rooms. Please try again."),
    );
  }
}

export function* watchCategories() {
  yield takeLatest(getCategories.type, handleGetCategories);
  yield takeLatest(getCategoryDetail.type, handleGetCategoryDetail);
  yield takeLatest(getRoomGrid.type, handleGetRoomGrid);
}
