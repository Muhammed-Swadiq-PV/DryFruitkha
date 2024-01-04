const products = require('../../model/productModel');
const Category = require('../../model/categoryModel')
const Jimp = require('jimp');
const path = require('path')
const fs = require('fs').promises;



const getAdminProductPage = async (req, res) => {
  try {
    const productData = await products.find()
    //    console.log(productData);
    res.render('admin/product', { productData })

  } catch (error) {
    console.log(error.message);
  }
}

const getAddProduct = async (req, res) => {
  try {
    const Categories = await Category.find()
    // const Categories = Array.from(new Set (category.map(cat => cat.name)))
    res.render('admin/addProduct', { Categories })
  } catch (error) {
    console.log(error.message)
  }
}



const resizeImage = async (inputPath, outputPath, width, height) => {
  const image = await Jimp.read(inputPath);
  await image.cover(width, height).writeAsync(outputPath);
};




// Controller for adding a new product
const postAddProduct = async (req, res) => {
  try {
    const { category, name, price, description, stock } = req.body;
    const Name = name.trim();
    const Description = description.trim();

    // Process each image file
    const processedImages = await Promise.all(
      req.files.map(async (file) => {
        // Resize and crop the image to 800x600
        const resizedImagesDirectory = path.join(__dirname, '../../public/resized_images');
        const resizedImagePath = path.join(resizedImagesDirectory, file.filename);
        await resizeImage(file.path, resizedImagePath, 800, 600);

        return `/resized_images/${file.filename}`;
      })
    );

    // Create a new product with the modified image array
    const newProduct = new products({
      image: processedImages,
      category,
      name: Name,
      price,
      description: Description,
      stock,
    });

    // Save the new product to the database
    await newProduct.save();



    // Redirect to the product page
    res.redirect('/admin/product');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};



const getStatusproduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const productData = await products.findById({ _id: productId });

    if (productData) {
      if (productData.status === true) {
        await products.findByIdAndUpdate({ _id: productId }, { $set: { status: false } })
      } else {
        await products.findByIdAndUpdate({ _id: productId }, { $set: { status: true } })
      }
    }
    res.redirect('/admin/product')
  } catch (error) {
    console.log(error.message);
  }
}

const getEditProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const productData = await products.findById({ _id: productId })
    //    console.log({productData})

    if (!productData) {
      res.status(404).send('product not found');
      return;
    }
    const categories = await Category.find();
    const uniqueCategories = Array.from(new Set(categories.map(cat => cat.name)));
    // console.log('productData-->', productData);
    res.render('admin/editProduct', { productData, Categories: uniqueCategories });

  } catch (error) {
    console.log(error.message);
  }
};


const postEditProduct = async (req, res) => {
  try {
    const productId = req.body.id;
    console.log('coming heree ',productId);
    const { name, category, price, description, stock ,offer, expiryDate} = req.body;
    // console.log('coming heree ',name, category, );
    console.log(req.body);

    const updatedProduct = await products.findById(productId);

    if (req.files && req.files.length > 0) {
      updatedProduct.image = req.files.map((file) => file.filename);
    } else {
      updatedProduct.image = updatedProduct.image;
    }

    const categoryObj = await Category.findOne({ name: category }); 
    updatedProduct.categoryId = categoryObj._id;

    updatedProduct.name = name.trim();
    updatedProduct.description = description.trim();
   

    if (price > 0 && stock > 0) {
      updatedProduct.price = price;
      updatedProduct.stock = stock;
      if (offer > 0) {
        // If there is an offer,
        updatedProduct.offer = offer;
        updatedProduct.discountPrice = price - offer;
        if (expiryDate) {
          updatedProduct.expiryDate = expiryDate;
        } else {
          
          return res.status(400).json({ success: false, message: 'Expiry date is required for products with an offer' });
        }
      } else {
        // If there is no offer, 
        updatedProduct.offer = 0;
        updatedProduct.discountPrice = 0;
        updatedProduct.expiryDate = undefined; 
      }
      await updatedProduct.save();

      res.json({ success: true, message: 'Product details updated successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Price and stock must be greater than 0' });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'An error occurred while updating product details' });
  }
};



const postAddImage = async (req, res) => {
  try {
    console.log(req.body, "postadd image product id");
    const productId = req.body.productId;

    // Process the added image
    const processedImage = req.files[0]; 

    // Resize and crop the image using the shared function
    const resizedImagesDirectory = path.join(__dirname, '../../public/resized_images');
    const resizedImagePath = path.join(resizedImagesDirectory, processedImage.filename);
    await resizeImage(processedImage.path, resizedImagePath, 800, 600);

    // Update the product with the new image URL
    const updatedProduct = await products.findById(productId);
    updatedProduct.image.push(`/resized_images/${processedImage.filename}`);
    await updatedProduct.save();

    res.json({ success: true, message: 'Image added successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


const postDeleteImage = async (req, res) => {
  try {
    const productId = req.body.productId;
    const imageIndex = req.body.imageIndex; 
    console.log(imageIndex, "post delete image ile image index");
    // Find the product by ID
    const product = await products.findById(productId);
    if (imageIndex >= 0 && imageIndex < product.image.length) {
      // Delete the corresponding image file
      const imagePath = path.join(__dirname, '../../public', product.image[imageIndex].substring(1));
      await fs.unlink(imagePath);

      // Remove the image URL from the product's image array
      product.image.splice(imageIndex, 1);

      // Save the updated product
      await product.save();

      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid image index' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};




module.exports = {
  getAdminProductPage,
  getAddProduct,
  postAddProduct,
  getStatusproduct,
  getEditProduct,
  postEditProduct,
  postAddImage,
  postDeleteImage

}