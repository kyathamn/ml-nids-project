import {createRoot} from 'react-dom/client';
import App from './App.tsx';
<<<<<<< HEAD
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
=======
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
>>>>>>> 9e372f9be5e4b46abecc9b872fa02883a8f7c163
