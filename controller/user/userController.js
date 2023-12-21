const userModel = require('../../model/userModel')
const bcrypt = require('bcryptjs')
const userMiddleware = require('../../middleware/userMiddleware')
const nodemailer = require('nodemailer')
const randomstring = require('randomstring');




let transporter = nodemailer.createTransport({
  service:"Gmail",
  auth:{
    user:"swadiqproject@gmail.com",
    pass:"noma vgqp tdhn dsww"
  }
})
const generateOTP = () =>{
   return randomstring.generate({
    length:6,
    charset:'numeric',
   })
  
}


const userOTP =async(email,otp)=>{
  try {
    const mailOption = {
      from:"swadiqproject@gmail.com",
      to:email,
      subject:"verify your email",
      html:`<p>  This is your verification otp ${otp} from Dry Fruitkha </p>`
    
    }
    transporter.sendMail(mailOption,(error)=>{
      if(error){
        console.log("errorotp")
      }else{
        console.log("code send")
      }
    })
  } catch (error) {
    console.log("error in userotp function",error.message)
  }
}

//resend otp function

const resentOTP = async (req, res) => {
  try {
    const newOTP = generateOTP(); 
    console.log(newOTP, "resentotp yile new otp");

    const email = req.session.email;
    await userOTP(email, newOTP);

    req.session.otp = newOTP;
    req.session.save();
  } catch (error) {
    console.error("Error in resendOTP function:", error);
    res.render('./users/404')
  }
};





const gethome = async (req, res) => {
  try {
    const userId = req.session.user
    const user = userId ? await userModel.findOne({_id:userId}) : false;

  
      res.render('users/home', { user});
    
    
  } catch (error) {
    console.log(error);
  }
}



// get login, if blocked error 
const getLogin = async(req, res) => {
  try {
    if(req.session.user){
     return res.redirect('/')
    }
    const userId = req.session.user
    const user = await userModel.findOne({_id:userId})

    const blockError = req.app.locals.specialContext
    req.app.locals.specialContext = null

    const blocked=req.app.locals.blocked
    req.app.locals.blocked = null

    res.render('users/login', { error: '', blockError,blocked , user:user||false})
  } catch (error) {
    console.log(error);
  }
}

const getSignUp = async(req, res) => {
  try {
    const userId = req.session.user
    const user = userId ? await userModel.findOne({_id:userId}) : false;

    if(req.session.user)
    {
      return res.redirect('/')
    }
    res.render('users/signUp',{error: '' ,user} )
  } catch (error) {
    console.log(error)
  }
}


//dealing otp inside postSignup

const postSignUp = async (req, res) => {

  try {
    const Firstname = req.body.Firstname
    const Lastname = req.body.Lastname
    const password = req.body.password
    const confirmPassword = req.body.confirmPassword
    const email = req.body.email
    const phone = req.body.phone

    const specialCharacterRegex = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/;

    if (!Firstname || !Lastname || !phone || !email || !password || !confirmPassword) {
      return res.render('users/signUp', { error: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.render('users/signUp', { error: 'Password must be at least 6 characters long' });
    }

    if (password !== confirmPassword) {
      return res.render('users/signUp', { error: 'Password do not match' });
    }

    if (!specialCharacterRegex.test(password)) {
      return res.render('users/signUp', { error: 'Password must include at least one special character.' });
    }

    const existUser = await userModel.findOne({ email });

    if (existUser) {
      return res.render('users/signUp', { error: 'Email already exist.' });
    }

    req.session.email = email;

    const hashedPassword = await bcrypt.hash(password, 10);

    req.session.userData = new userModel({
      Firstname,
      Lastname,
      phone,
      email,
      password: hashedPassword,
      confirmPassword: hashedPassword,
    });
    const otp = generateOTP();
    
    req.session.otp = otp;
    
     await userOTP(email,otp);
     res.redirect('/verifyOTP?fromSignUpPage=true');
  } catch (error) {
    console.error(error);
   
  }
};

  




//verify otp


const getVerification = async(req,res) =>{
  try {
     
    const userId = req.session.user
    const user = await userModel.findOne({_id:userId})
    const email = req.session.email;
    const alert = "Incorrect OTP. Please try again.";
    res.render('users/verifyOTP',{email,alert, user:user||false})
  } catch (error) {
    console.log(error.message)
  }
};


const postOTPverification = async (req , res)=>{
  try {
    console.log("posted verification otp");
    const enteredOTP=req.body.otp;
    const generatedOTP=req.session.otp;
    // console.log(enteredOTP,generatedOTP)
    const email = req.session.email;
    if(enteredOTP!==generatedOTP){
        return res.render('users/verifyOTP',{alert:'Invalid OTP',email})
    }
    const  {Firstname,Lastname,phone,password}=req.session.userData;
    console.log(req.session.userData)
          const newUser=new userModel({
              Firstname,
              Lastname,
              phone,
              email,
              password
          });
          await newUser.save();
          delete req.session.otp;
          delete req.session.userData;
          res.redirect('/login')
  } catch (error) {
    console.log(error.message)
  }
}



//userlogin


const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (user) {
      if (user.status) {
      
        let checkPassword = bcrypt.compareSync(password, user.password);

        if (checkPassword) {
          req.session.user = user._id;
          console.log('session1:', req.session.user);
          return res.redirect('/');
        } else {
          // Incorrect password
          req.app.locals.blockError = "Invalid email or password.";
          return res.redirect('/login');
        }
      } else {
        // User is blocked
        req.app.locals.blocked = "User is blocked.";
        return res.redirect('/login');
      }
    } else {
      // Non-existing user
      req.app.locals.blockError = "User does not exist.";
      return res.redirect('/login');
    }
  } catch (error) {
    console.error("Error:", error);
   
    return res.redirect('/login');
  }
};


//userLogout
const postLogout = async (req, res) => {
  try {
    console.log("logout")
    req.session.destroy()
    res.redirect('/')
  } catch (error) {
    console.log(error.message);
  }
}


const getVerifyEmail = async(req,res)=>{
  try {
   res.render('./users/verifyEmail')
  } catch (error) {
   console.error(error.message)
  }
 }

 const verifyEmail = async (req, res) => {
  try {
    const email = req.body.email;
    // console.log(email, "verify emailile mail sessionil store cheythu")
    const user = await userModel.findOne({ email: email });

    if (user) {
      const newOTP = generateOTP();
      console.log(newOTP ,"forgot passwordinulla kkulla new otp")
      await userOTP(email, newOTP);

      req.session.otp = newOTP;
      req.session.email = email;
      req.session.save();

      res.redirect(`/forgotOTP`);
    } else {
      res.status(404).json({ status: 'not-found', message: 'Email not found' });
    }
  } catch (error) {
    console.error("Error in verifyEmail function:", error);
    res.render('./users/404');
  }
};
 


const getOTPforPassword = async (req, res) => {
  try {
    const email = req.session.email;
    // console.log(email, "get otp for password il email already session ilulla");
    res.render('./users/forgotOTP', { email });
  } catch (error) {
    console.error(error.message);
  }
};


const postVerifyForgotOTP = async (req, res) => {
  try {
    console.log("inside verify forgot otp");
      const enteredOTP = req.body.otp;
      const storedOTP = req.session.otp;

      if (enteredOTP === storedOTP) {
          // Correct OTP, redirect to resetPassword page
          res.redirect('/resetPassword');
      } else {
          // Incorrect OTP, send error message
          res.render('./users/forgotOTP', { alert: 'Invalid OTP', email: req.body.email });
      }
  } catch (error) {
      
      res.render('./users/404');
  }
};

const postResendForgotOTP = async (req, res) => {
  try {
      const newOTP = generateOTP();

      const email = req.body.email;
      await userOTP(email, newOTP);

      req.session.otp = newOTP;
      req.session.save();

      res.json({ success: true });
  } catch (error) {
      console.error("Error in postResendForgotOTP:", error);
      res.render('./users/404');
  }
};


const getResetPassword = async(req,res)=>{
  try {
    const email = req.session.email;

    console.log("getresetpasswordile session ilethi");
    res.render('./users/resetPassword');
  } catch (error) {
    console.error(error.message);
  }
}

const postResetPassword = async (req, res) => {
  try {
      const email = req.body.email;
      const newPassword = req.body.newPassword;
      const confirmPassword = req.body.confirmPassword;

      if (newPassword !== confirmPassword) {
          return res.render('resetPassword', { email, alert: 'Passwords do not match' });
      }

     
       const user = await userModel.findOneAndUpdate({ email }, { password: newPassword });

     
      delete req.session.email;
      delete req.session.otp;

     
      res.redirect('/login');
  } catch (error) {
      console.error("Error in postResetPassword:", error);
      res.render('./users/404');
  }
};






module.exports = {
  gethome,
   getLogin,
    getSignUp,
     postSignUp,
      postLogin,
       postLogout ,
       getVerification,
        postOTPverification,
        resentOTP,
        verifyEmail,
        getVerifyEmail,
        getOTPforPassword,
        postVerifyForgotOTP,
        postResendForgotOTP,
        postResetPassword,
        getResetPassword,
        
}
