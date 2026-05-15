import { setOpenStateChat } from "@/app/store/features/overLaySlice";
import "./UserList.css";
import { getChatUsers } from "@/app/store/features/userSlice";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { useSession } from "next-auth/react";
import { Dispatch, SetStateAction, useEffect } from "react";

type propType = {
  setSelectedUser: Dispatch<
    SetStateAction<{ id: string; Name: string; status: string } | null>
  >;
};

const UserList = ({ setSelectedUser }: propType) => {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.user);
  const isOpenChat = useAppSelector((state) => state.overlay.isUserListOpen);

  useEffect(() => {
    if (session?.backendToken && isOpenChat) {
      // dispatch action to get users
      dispatch(getChatUsers({ token: session.backendToken }));
    }
  }, [isOpenChat, session]);

  return (
    <div className="user-list-container">
      <h3>Connections </h3>
      {users?.chatUsers?.map(
        (user: { id: string; Name: string; status: string }) => (
          <button
            key={user.id}
            onClick={() => {
              setSelectedUser(user);
              dispatch(setOpenStateChat(true));
            }}
            disabled={false}
            className="user-list-item"
          >
            {user.Name}
          </button>
        ),
      )}
    </div>
  );
};

export default UserList;
