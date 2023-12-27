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
    try {
        const email = req.body.email;
        const password = req.body.Password;

        const adminData = await adminModel.findOne({ email });

        if (adminData && adminData.password === password) {
            req.session.admin = adminData.email;
            res.redirect('/admin/adminDashboard');
        } else {
            console.log('Password incorrect');
            res.status(400).redirect('/admin/login');
        }
    } catch (error) {
        console.log(error);
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