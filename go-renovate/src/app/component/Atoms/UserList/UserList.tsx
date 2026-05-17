import { setOpenStateChat } from "@/app/store/features/overLaySlice";
import "./UserList.css";
import { getChatUsers } from "@/app/store/features/userSlice";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { useSession } from "next-auth/react";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Loader3 } from "../../Molecules/Loader/Loader";

type propType = {
  setSelectedUser: Dispatch<
    SetStateAction<{ id: string; Name: string; status: string } | null>
  >;
};

const UserList = ({ setSelectedUser }: propType) => {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.user);
  const isOpenUserList = useAppSelector(
    (state) => state.overlay.isUserListOpen,
  );
  const isOpenChat = useAppSelector((state) => state.overlay.isChatOpen);
  const isOpen = useAppSelector((state) => state.overlay.isOpen);

  useEffect(() => {
    if (session?.backendToken && (isOpenChat || isOpen || isOpenUserList)) {
      // dispatch action to get users
      dispatch(getChatUsers({ token: session?.backendToken }));
    }
  }, [isOpenUserList, isOpenChat, session, isOpen]);

  if (!(users?.chatUsers.length > 0))
    return (
      <div className="loader-userlist">
        <Loader3 />
      </div>
    );

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
