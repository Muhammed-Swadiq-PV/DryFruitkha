const adminModel = require('../../model/adminModel');
const bcrypt=require('bcryptjs')





const getlogin = async(req,res) =>{
    try {
       res.render('admin/adminSignin') 
    } catch (error) {
        console.log(error);
    }
}

const postlogin = async (req, res) => {
    console.log("entered post login");
    try {
        const email = req.body.email;
        const password = req.body.Password;
        console.log(email, password);

        const adminData = await adminModel.findOne({ email });

        if(!adminData){
            res.render('admin/adminSignin',{alert: 'invalid mail or password'});
        }else if(adminData && adminData.password === password) {
            req.session.admin = adminData.email;
            res.redirect('/admin/adminDashboard');
        } else {
            console.log('Password incorrect');
            res.render('admin/adminSignin',{alert: 'incorrect password'});
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}




const postLogout = async(req , res)=>{
    try {
        req.session.destroy((error)=>{
            if(error){
                console.error(error);
            }
        })
        res.redirect('/admin/login')
    } catch (error) {
        console.log(error);
    }
}




module.exports = {
    getlogin,
    postlogin,
   
    postLogout
}