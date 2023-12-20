const User = require('../model/userModel')

 //checking user session and user status
const loggedIn = async (req, res, next) => {
    try {

        if (req.session.userId && req.session.status) {
            console.log('session is there and status true')
            next()
        } else {
            req.session.destroy()
            res.redirect('/login')
        }

    } catch (error) {
        console.log(error);
    }
}


  
//checks the user blocked or not+
const blockStatus = async (req,res,next)=>{
    try {
        if(req.session.userId){
            const userDetail = await User.findOne({_id:req.session.userId})
            console.log('midlwre userdata',userDetail)
            if(userDetail && userDetail.status){
                return next()
            }else{
                console.log('user blocked')
                req.app.locals.specialContext="user blocked"
                req.session.destroy()
                res.redirect('/login')
            }
        }else{
            console.log('no session');
            next()
        }
    } catch (error) {
        console.log(error.message)
    }
}


module.exports = { loggedIn,blockStatus }