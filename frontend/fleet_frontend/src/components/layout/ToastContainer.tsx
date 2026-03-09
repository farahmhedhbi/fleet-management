import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RootLayout({ children }: any) {

  return (
    <html>
      <body>

        {children}

        <ToastContainer position="top-right" />

      </body>
    </html>
  );

}