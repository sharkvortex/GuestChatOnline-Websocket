import { createRoot } from 'react-dom/client'
import './main.css'
import { BrowserRouter, Routes, Route } from 'react-router'
import { ToastContainer } from 'react-toastify'
import MainPage from '@pages/MainPage'
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<MainPage />}></Route>
    </Routes>
    <ToastContainer position="top-center" autoClose={2000} />
  </BrowserRouter>
)
