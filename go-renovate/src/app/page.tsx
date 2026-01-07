"use client";
import ProductListPage from "./component/Molecules/ProductListPage/ProductListPage";

export default function Home() {
  // const { data: session, status } = useSession();
  // const navigate = useRouter();
  // const dispatch = useAppDispatch();
  // const { user, loading, error, token } = useAppSelector((state) => state.auth);

  return (
    <div>
      <ProductListPage />
      {/* <LoginContainer /> */}
    </div>
  );
}
