import shelfVerseLogo from "../../assets/shelfverse-logo.svg";

export default function SplashScreen() {
  return (
    <section className="splash-screen">
      <div className="splash-content">
        <img className="splash-logo-img" src={shelfVerseLogo} alt="ShelfVerse logo" />
        <h1>ShelfVerse</h1>
        <p>Loading your reading universe...</p>
        <div className="splash-loader" aria-hidden="true">
          <span className="splash-loader-bar" />
        </div>
        <div className="splash-loader-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}
