import bcrypt, { hash } from 'bcryptjs' ;
import  jwt  from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';



 
export const register = async (req, res) => { 
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ success: false, message: 'missing details' });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: 'user already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({ name, email, password: hashedPassword });
    await user.save();

    // generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // re cookie (optional, if you want)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // res.cookie('token', token ,{
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    //   maxAge : 7 * 24 * 60 * 60 * 1000
    // });

    // send welcome mail
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: `Welcome to mygreatstack`,
      text: `Welcome to greatstack website. Your account has been created with email id: ${email}`
    };
    await transporter.sendMail(mailOptions);

    // 🔥 return token + user so frontend can save it
    return res.json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAccountVerified: user.isAccountVerified
      }
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const login = async (req , res)=>  {
  const { email, password} = req.body;

  if(!email || !password){
    return res.json({success: false, message:'Email and password are required'})
  }

  try{
    const user = await userModel.findOne({email});

    if(!user){
      return res.json({success: false, message: 'invalid email or password'})
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      return res.json({success:false, message: 'Invalid password'})
    } 

    const token = jwt.sign({id: user._id},process.env.JWT_SECRET, {expiresIn: '7d'});

    res.cookie('token', token ,{
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge : 7 * 24 * 60 * 60 * 1000
    });

    // 🔥 return token + user details
    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAccountVerified: user.isAccountVerified
      }
    });

  }catch (error){
    return res.json({success: false, message: error.message});
  }
}

export const logout = async (req, res)=>{
  try{
      res.clearCookie('token', {
           httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

      })

      return res.json({success: true, message: "logout"})

  }catch(error){
    return res.json({success: false, message: error.message})
  }
}

//send verification otp to users email

export const sendVerifyOTP = async (req, res) => {
  try {
    const userId = req.userId;   // 🔥 coming from middleware
    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOTP = otp;
    user.verifyOTPexpired = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      // text: `Your OTP is ${otp}. Verify your account using this OTP.`
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Verification OTP sent to registered email" });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//verify email using otp

export const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  const userId = req.userId;   // ✅ take userId from middleware

  if (!otp) {
    return res.json({ success: false, message: 'missing details' });
  }

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: 'user not found' });
    }

    if (!user.verifyOTP || user.verifyOTP !== otp) {
      return res.json({ success: false, message: 'invalid otp' });
    }

    if (user.verifyOTPexpired < Date.now()) {
      return res.json({ success: false, message: 'otp expired' });
    }

    user.isAccountVerified = true;
    user.verifyOTP = '';
    user.verifyOTPexpired = 0;

    await user.save();
    return res.json({ success: true, message: 'email verified successfully' });

  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
}

//check if user is authecticated
export const isAuthenticated = async (req , res)=>{
try{
   return res.json({success: true});
}catch(error){
  res.json({success : false, message: error.message})
}
}

//send password reset otp

export const sendResetOtp = async (req, res)=> {
  const{email} = req.body;

  if(!email){
    return res.json({success:false, message:'email is required'})
  }
  try{

    const user = await userModel.findOne({email});
    if(!user){
     return res.json({success: false, message: 'user not found'});
    }
     const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOTP = otp;
    user. resetOTPexpired= Date.now() + 15 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password reset OTP",
      // text: `Your OTP for reseting your password is ${otp}. reset your password using this OTP.`
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    };

    await transporter.sendMail(mailOptions);

    return res.json({success: true, message:'otp sent to your email successfully'})


  }catch(error){
    return res.json({success:false, message: error.message})
  }
}

//reset user password

export const resetPassword = async (req, res)=> {
   const {email, otp , newPassword} = req.body;

   if(!email || !otp || !newPassword){
    return res.json({success : false, message:'email, otp, and new password are required'});
   }
   try{
     const user = await userModel.findOne({email});
     if(!user){
      return res.json({success: false, message: 'user no found'});
     }

     if (user.resetOTP === "" || user.resetOTP !== otp){
      return res.json({success: false, message: 'invalid otp'});

     }

     if(user.resetOTPexpired < Date.now()){
      return res.json({success: false, message: 'otp expired'});

     }
     const hashedPassword = await bcrypt.hash(newPassword, 10);

     user.password = hashedPassword;

     user.resetOTP  = '';

     user.resetOTPexpired = 0;

     await user.save();

     return res.json({success: true, message: 'password reset successfully'});

     


   }catch(error){
    return res.json({success: false, message: error.message});
   }
}
