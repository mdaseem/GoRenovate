import AuthButtons from "../component/Atoms/AuthButtons/AuthButtons";
import Header from "../component/Atoms/Header/Header";

export default function HomePage() {
  const renderHeader = () => {
    return <Header />;
  }
  return (
    <div className="login-page">
      {renderHeader()}
      <AuthButtons />
      {`home page`}
    </div>
  );
}
