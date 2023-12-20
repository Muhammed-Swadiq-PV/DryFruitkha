const adminModel = require('../../model/adminModel');
const bcrypt=require('bcryptjs')





const getlogin = async(req,res) =>{
    try {
       res.render('admin/adminSignin') 
    } catch (error) {
        console.log(error);
    }
}

const postlogin = async(req, res) => {
    try {
        
        const email = req.body.email;
        const Password = req.body.Password;

        

    const adminData=await adminModel.findOne({email})

        console.log(adminData,"admindetails");
        if (adminData) {
            const passwordCheck=bcrypt.compare(adminData.password,Password)
            if (passwordCheck) {
                req.session.admin = adminData.email;
                res.redirect('/admin/adminDashboard');
            } else {
                console.log('password incorrect');
                res.redirect('/admin/login', { error: "incorrect password or email" });
            }
        } else {
            console.log('not found');
            res.redirect('/admin/login');
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