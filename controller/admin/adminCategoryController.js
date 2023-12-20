const category = require('../../model/categoryModel')
const products = require('../../model/productModel')


//for category
const getAdminCategoryPage = async (req, res) => {
    try {
        const categoryData = await category.find();
        res.render('admin/category', { categoryData, error: req.query.error });
    } catch (error) {
        console.log(error.message);
    }
};







//for adding data in category modal
const AddAdminCategoryPage = async(req , res)=>{
    try {
        const categoryName = req.body.categoryName.trim();
        const categoryDescription = req.body.categoryDescription.trim();

        const formattedCategoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();


        const existingCategory = await category.findOne({ name: formattedCategoryName});

        if (existingCategory) {
            // If category already exists, send an error response
            return res.json({ message: 'Category already exists' });
        }

   
        const newCategory = new category({
           name: formattedCategoryName,
           description:categoryDescription,
        })
        await newCategory.save()
       
        res.render('admin/category')

    } catch (error) {
       
        console.log(error.message)
    }
};








// for list and delist category
const getStatusCategory = async (req , res) =>{
    try {
     const categoryId = req.params.id

     const categoryData = await category.findById({_id:categoryId})   

     if(categoryData){
         if(categoryData.status === true){
            await category.findByIdAndUpdate({_id:categoryId} ,{$set: {status:false}})
         }   else{
            await category.findByIdAndUpdate({_id:categoryId} , {$set: {status:true}})
         }
     }
     res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message)

        
    }
}



module.exports = {
    getAdminCategoryPage,
    AddAdminCategoryPage,
    getStatusCategory
}