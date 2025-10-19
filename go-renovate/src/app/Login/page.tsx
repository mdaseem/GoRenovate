// import AuthButtons from "../component/Atoms/AuthButtons";
import Header from "../component/Atoms/Header/Header";
import Login from "../component/Atoms/Login/Login";

export default function LoginPage() {
  const renderHeader = () => {
    return <Header />;
  }
  return (
    <div className="login-page">
      {renderHeader()}
      <Login />
    </div>
  );
}
