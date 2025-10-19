import Header from "./component/Atoms/Header/Header";
import { LoginContainer } from "./component/Molecules/LoginContainer/LoginContainer";

export default function Home() {
  const renderHeader = () => {
    return <Header />;
  };
  return (
    <div>
      {renderHeader()}
      <LoginContainer />
    </div>
  );
}
