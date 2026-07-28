import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  return (
    <>
      <Sidebar />

      <main
        style={{
          marginLeft: 280,
          minHeight: "100vh",
          background: "var(--bg-page)",
          color: "var(--text-primary)",
          padding: 30,
        }}
      >
        <Topbar />

        {children}
      </main>
    </>
  );
}
