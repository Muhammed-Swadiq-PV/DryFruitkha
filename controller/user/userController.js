const userModel = require('../../model/userModel')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const randomstring = require('randomstring');
const shortid = require('shortid');
require('dotenv').config()


let transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "swadiqproject@gmail.com",
    pass: process.env.ADMIN_PASSWORD
  }
})
const generateOTP = () => {
  return randomstring.generate({
    length: 6,
    charset: 'numeric',
  })

}


const userOTP = async (email, otp) => {
  try {
    const mailOption = {
      from: "swadiqproject@gmail.com",
      to: email,
      subject: "verify your email",
      html: `<p>  This is your verification otp ${otp} from Dry Fruitkha </p>`

    }
    transporter.sendMail(mailOption, (error) => {
      if (error) {
        console.log("errorotp")
      } else {
        console.log("code send")
      }
    })
  } catch (error) {
    console.log("error in userotp function", error.message)
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
    const user = userId ? await userModel.findOne({ _id: userId }) : false;


    res.render('users/home', { user });


  } catch (error) {
    console.log(error);
  }
}



// get login, if blocked error 
const getLogin = async (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect('/')
    }
    const userId = req.session.user
    const user = await userModel.findOne({ _id: userId })

    const blockError = req.app.locals.specialContext
    req.app.locals.specialContext = null

    const blocked = req.app.locals.blocked
    req.app.locals.blocked = null

    res.render('users/login', { error: '', blockError, blocked, user: user || false })
  } catch (error) {
    console.log(error);
  }
}

const getSignUp = async (req, res) => {
  try {
    const userId = req.session.user
    const user = userId ? await userModel.findOne({ _id: userId }) : false;

    if (req.session.user) {
      return res.redirect('/')
    }
    res.render('users/signUp', { error: '', user })
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
    const referedReferralCode = req.body.referralCode;

    const specialCharacterRegex = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/;
    const alphabetRegex = /^[a-zA-Z]+$/;

    if (!Firstname || !Lastname || !phone || !email || !password || !confirmPassword) {
      return res.render('users/signUp', { error: 'All fields are required.' });
    }

    if (!alphabetRegex.test(Firstname) || !alphabetRegex.test(Lastname)) {
      return res.render('users/signUp', { error: 'First name and last name should contain only alphabets.' });
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

    let referredUser = null;

    if (referedReferralCode) {
      // console.log(referedReferralCode, "referedReferralCode");
      referredUser = await userModel.findOne({ referralCode: referedReferralCode });
      // console.log(referredUser, "referredUser");
      if (referredUser) {
        console.log('Referred User ID:', referredUser._id);
      } else {
        console.log('Reference code not found in database');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const referralCode = shortid.generate();
    req.session.referredUser = referredUser;

    req.session.userData = new userModel({
      Firstname,
      Lastname,
      phone,
      email,
      password: hashedPassword,
      confirmPassword: hashedPassword,
      referralCode
    });
    const otp = generateOTP();

    console.log(otp, " otp for our signup");
    req.session.otp = otp;

    await userOTP(email, otp);
    res.redirect('/verifyOTP?fromSignUpPage=true');
  } catch (error) {
    console.error(error);

  }
};






//verify otp


const getVerification = async (req, res) => {
  try {

    const userId = req.session.user
    const user = await userModel.findOne({ _id: userId })
    const email = req.session.email;
    const alert = req.query.error === 'true' ? 'Incorrect OTP. Please try again.' : null;
    res.render('users/verifyOTP', { email, alert, user: user || false })
  } catch (error) {
    console.log(error.message)
  }
};


const postOTPverification = async (req, res) => {
  try {
    console.log("posted verification otp");
    const enteredOTP = req.body.otp;
    const generatedOTP = req.session.otp;
    // console.log(enteredOTP,generatedOTP)
    const email = req.session.email;
    if (enteredOTP !== generatedOTP) {
      return res.render('users/verifyOTP', { alert: 'Invalid OTP', email })
    }
    const { Firstname, Lastname, phone, password } = req.session.userData;
    // console.log(req.session.userData)
    if (req.session.referredUser) {
      // Adding 51 rupees to the referred users wallet
      let referredUser = req.session.referredUser;

      // Check if referredUser is an instance of userModel
      if (!(referredUser instanceof userModel)) {
        referredUser = await userModel.findById(referredUser._id);
      }
      // Check if the referredUser has a wallet array
      if (!referredUser.wallet) {
        referredUser.wallet = [];
      }

      const rewardAmount = 51;
      const totalBalance = referredUser.wallet.reduce(
        (total, entry) => total + entry.creditAmount - entry.debitAmount,
        0
      ) + rewardAmount;


      
      referredUser.wallet.push({
        balance: totalBalance,
        date: new Date(),
        creditAmount: rewardAmount,
        debitAmount: 0,
        transactionType: 'Referral Reward',
      });

      await referredUser.save();
    }
    const newUser = new userModel({
      Firstname,
      Lastname,
      phone,
      email,
      password
    });
    await newUser.save();
    delete req.session.otp;
    delete req.session.userData;
    delete req.session.referredUser;
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
          return res.render('./users/login',{alert:'Password or email incorrect'})
        }
      } else {
        // User is blocked
        return res.render('./users/login',{alert:"Can't access your account."})
      }
    } else {
      // Non-existing user
      return res.render('./users/login',{alert:"If you don't have an account please signup."});
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


const getVerifyEmail = async (req, res) => {
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
      console.log(newOTP, "forgot passwordinulla kkulla new otp")
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
    console.log(req.body);
    const enteredOTP = req.body.otp;
    const storedOTP = req.session.otp;
    console.log(storedOTP, "storedotp", enteredOTP, "entered otp");

    if (enteredOTP === storedOTP) {
      // Correct OTP, redirect to resetPassword page
      res.json({ success: true, redirectUrl: '/resetPassword' });
    } else {
      // Incorrect OTP, send error message
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


const postResendForgotOTP = async (req, res) => {
  try {
    const newOTP = generateOTP();
    console.log(newOTP, "resend otp yile otp");
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


const getResetPassword = async (req, res) => {
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


const changePassword = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await userModel.findById(userId);

    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmPassword;
    console.log(oldPassword, newPassword, confirmNewPassword, "old, new, confirm");

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.render('users/changePassword', { error: 'Incorrect old password.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.render('users/changePassword', { error: 'New passwords do not match.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await userModel.findByIdAndUpdate(userId, { password: hashedPassword });

    res.redirect('/userProfile');

  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
    console.error('Error in postChangePassword:', error);
    res.render('./users/404');
  }
}



module.exports = {
  gethome,
  getLogin,
  getSignUp,
  postSignUp,
  postLogin,
  postLogout,
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
  changePassword
}

