import React from 'react'
import { Routes, Route } from 'react-router-dom'
import EmailVerify from './pages/EmailVerify'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/home'
import Login from './pages/login'
 import { ToastContainer } from 'react-toastify';
 import 'react-toastify/dist/ReactToastify.css';
import {toast} from 'react-toastify';

const App = () => {
  return (
    <div>
    <ToastContainer/>
      <Routes>
    <Route path='/' element={<Home/>}/>
    <Route path='/login' element={<Login/>}/>
    <Route path='/email-verify' element={<EmailVerify/>}/>
    <Route path='/reset-password' element={<ResetPassword/>}/>
      </Routes>
    </div>
  )
}

export default App
