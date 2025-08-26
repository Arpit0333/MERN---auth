import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext = createContext()

export const AppContextProvider = (props)=>{


  axios.defaults.withCredentials = true;

  const backendUrl = import.meta.env.VITE_BACKEND_URL
  const [isLoggedin, setIsLoggedin] = useState(false)
  const [userData, setUserData] = useState(null)

 const getAuthState = async()=>{
  try{
     const {data} = await axios.get(backendUrl + '/api/user/is-auth') 
      if(data.success) {
        setIsLoggedin (true)
        getUserData()
      }
  }catch (error) {
    const msg = error.response?.data?.message || error.message;

    // ❌ Don't show toast if it's that "Not authorized" message
    if (msg !== "Not authorized, Please login again") {
      toast.error(msg);
    }
    console.log("Auth state error:", msg);
  }
}

  

const getUserData = async () => {
    try {
      const {data} = await axios.get(backendUrl + '/api/user/data')
      data.success ? setUserData(data.userData) : toast.error(data.message)
    }catch (error) {
    const msg = error.response?.data?.message || error.message;

    if (msg !== "Not authorized, Please login again") {
      toast.error(msg);
    }
    console.log("User data error:", msg);
  }
}
 

    useEffect(()=>{
    getAuthState();
    },[])



  const value = {
    backendUrl,
    isLoggedin, setIsLoggedin,
    userData, setUserData, 
    getUserData
  }



 return(
  <AppContext.Provider value={value}>
    {props.children}

    </AppContext.Provider>
 )


}