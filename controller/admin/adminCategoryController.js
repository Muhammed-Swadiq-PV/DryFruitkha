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
const AddAdminCategoryPage = async (req, res) => {
    try {
      const categoryName = req.body.categoryName.trim();
      const categoryDescription = req.body.categoryDescription.trim();
  
      const formattedCategoryName =
        categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
  
      const existingCategory = await category.findOne({ name: formattedCategoryName });
  
      if (existingCategory) {
        // If category already exists, send an error response
        return res.status(400).json({ error: 'Category already exists' });
      }
  
      const newCategory = new category({
        name: formattedCategoryName,
        description: categoryDescription,
      });
  
      // Validate the newCategory object before saving
      const validationError = newCategory.validateSync();
      if (validationError) {
        // If validation fails, send an error response with the validation error message
        return res.status(400).json({ error: validationError.message });
      }
  
      await newCategory.save();
      res.render('admin/category');
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  



const editCategory = async (req, res) => {
    try {
       
        const categoryId = req.params.id; 
        console.log(categoryId, "category Id");
        const updatedCategoryName = req.body.updatedCategoryName.trim();
        const updatedCategoryDescription = req.body.updatedCategoryDescription.trim();

        const formattedUpdatedCategoryName = updatedCategoryName.charAt(0).toUpperCase() + updatedCategoryName.slice(1).toLowerCase();

        const existingCategory = await category.findById(categoryId);

        if (!existingCategory) {
            // If category doesn't exist, send an error response
            return res.json({ message: 'Category not found' });
        }

        if (existingCategory.name !== formattedUpdatedCategoryName) {
    // Check if a category with the updated name already exists
    const existingCategoryWithUpdatedName = await category.findOne({ name: formattedUpdatedCategoryName });

    if (existingCategoryWithUpdatedName) {
        // If a category with the updated name already exists, send an error response
        return res.json({ message: 'Category with updated name already exists' });
    }
}

        // Update the category properties
        existingCategory.name = formattedUpdatedCategoryName;
        existingCategory.description = updatedCategoryDescription;

        // Save the changes
        await existingCategory.save();

        res.json({ message: 'Category updated successfully' });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};





// for list and delist category
const getStatusCategory = async (req, res) => {
    try {
      const categoryId = req.params.id;
      
      const categoryData = await category.findById({ _id: categoryId });

  
      if (categoryData) {
        const currentStatus = categoryData.status;
        const newStatus = !currentStatus;
  
        await category.findByIdAndUpdate({ _id: categoryId }, { $set: { status: newStatus } });
      }
      res.redirect('/admin/category');
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  };
  


module.exports = {
    getAdminCategoryPage,
    AddAdminCategoryPage,
    getStatusCategory,
    editCategory
}