const mongoose = require('mongoose');
const express = require('express');
const app = express();
const path = require("path");
const nocache = require('nocache')
const session = require('express-session');
userRouter = require('./router/userRouter');
adminRouter = require('./router/adminRouter')
require('dotenv').config()


// mongoDb connection

mongoose.connect(process.env.MongoDB_URI)
.then(() => {
  console.log('MongoDB connected');
})
.catch((error) => {
  console.error(error.message);
});




app.set('view engine','ejs')
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname,'public')))
app.use('/resized_images', express.static(path.join(__dirname, 'public', 'resized_images')));



app.use(nocache())
app.use(express.json())
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'your-secret-key',       
  resave: false,                
  saveUninitialized: false,                          
}));   







app.use("/",userRouter)
app.use("/admin",adminRouter)

app.use((req,res)=>{
  res.status(404).render('./users/404')
})



app.listen(8000,()=>{
  console.log('server is listening http://localhost:8000')
});
