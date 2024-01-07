
const products = require('../../model/productModel');
const category = require('../../model/categoryModel');
const userModel = require('../../model/userModel');
const Order = require('../../model/orderModel');



//get userProfile

const getUserProfile = async (req , res)=>{
    try {
      const userId = req.session.user;
  
      if (!userId) {
        return res.redirect('/login');
      }
  
      const user = await userModel.findById(userId).populate('cart.productId');
      
      const cartItem = user.cart.map(item => {
        return {
          product: item.productId,
          totalPrice: item.totalPrice,
          quantity: item.quantity,
        };
      });
      
      const orders = await Order.find({ userId: user._id }).sort({ orderDate: -1 });
  
      res.render('./users/userProfile', { cartItem , user , orders, referralCode: user.referralCode,});
      
      
    } catch (error) {
      console.error(error)
    }
  }


  //-------------------Edit  user profile from user profile page---------------------
//=================================================================================

const updateUserProfile = async (req, res) => {
    try {
      const userId = req.session.user;
      // console.log(userId, "userId edit cheyyumbol");
  
      if (!userId) {
        return res.redirect('/login');
      }
  
      const { editFirstName, editLastName, editPhoneNumber } = req.body;
  
  
      const user = await userModel.findById(userId);
      // console.log(user,"user in updateUserprofile",  editFirstName,"firstName",editLastName,"lastName",editPhoneNumber,"phoneNumber");
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      //edit and update the data to data base 
      user.Firstname = editFirstName;
      user.Lastname = editLastName;
      user.phone = editPhoneNumber;
  
      await user.save();
      // console.log("responsing with success++true");
      res.redirect('/userProfile');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };

//-----------------------add address from user checkout page------------------
  //==========================================================================

  const addAddressCheckout = async (req, res) => {
    try {
        const userId = req.session.user;

        const { firstName, LastName, address, Postcode, city, state, district, phones } = req.body;

        const user = await userModel.findById(userId);

        const billingDetails = {
            firstName,
            LastName,
            address,
            Postcode,
            city,
            state,
            district,
            phones,
        };

        user.address.push(billingDetails);

        await user.save();

        // If the user has no addresses, set the new address as default
        if (user.address.length === 1) {
            user.address[0].isDefault = true;
            await user.save();
        }

        // Find the default address after saving
        const defaultAddress = user.address.find(address => address.isDefault);

        // Send a success response with the default address information
        res.json({ success: true, defaultAddress });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};




//-----------------------add address from user profile------------------
  //==========================================================================
  
  const addAddress = async (req, res) => {
    try {
      const userId = req.session.user;
  
      const { firstName, LastName, address, Postcode, city, state, district, phones } = req.body;
  
      const user = await userModel.findById(userId);
  
      const cartItem = user.cart.map(item => ({
        product: item.productId,
        totalPrice: item.totalPrice,
        quantity: item.quantity,
      }));
  
      const billingDetails = {
        firstName,
        LastName,
        address,
        Postcode,
        city,
        state,
        district,
        phones,
      };
  
      user.address.push(billingDetails);
  
      await user.save();

      // If the user has only one address, set it as default
      if (user.address.length === 1) {
        user.address[0].isDefault = true;
        await user.save();
      }

      // Find the default address after saving
      const defaultAddress = user.address.find(address => address.isDefault);

      // res.render('./users/checkout', { cartItem, user, billingDetails, defaultAddress });
      res.redirect('/addressBook')
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
};

  
  
  //----------- making the address as default when selecting----------------
  //========================================================================

  const setDefaultAddress = async (req, res) => {
    
    const addressId = req.params.addressId;

  
    try {
      const userId = req.session.user;
      // console.log(userId, "setdefault addressile userId");
      const user = await userModel.findById(userId);
      // console.log(user, "user setdefault addressile user");
  
      user.address.forEach((address) => {
        address.isDefault = address._id.equals(addressId);
      });
  
      await user.save();
  
      res.status(200).json({ success: true, message: 'Default address set successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
  
  // -------------------------deleteAddressFromUserProfile----------------------------------
  // =======================================================================================

  const deleteAddress = async (req, res) => {
    try {
      const userId = req.session.user;
      const addressId = req.params.addressId;
  
      const user = await userModel.findById(userId);
  
      if (!user) {
        return res.render('./users/404');
      }
  
      // Filter out the address with the given ID
      user.address = user.address.filter((address) => !address._id.equals(addressId));
  
      await user.save();
  
      res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };








  const updateAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        console.log(userId, "userid");
        const { addressId, updatedAddressData } = req.body;
        console.log(req.body , 'update address');

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const addressToUpdate = user.address.id(addressId);

        if (!addressToUpdate) {
            return res.render('./users/404')
        }

        addressToUpdate.firstName = updatedAddressData.firstName;
        addressToUpdate.LastName = updatedAddressData.LastName;
        addressToUpdate.state = updatedAddressData.state;
        addressToUpdate.address = updatedAddressData.address;
        addressToUpdate.city = updatedAddressData.city;
        addressToUpdate.Postcode = updatedAddressData.Postcode;
        addressToUpdate.district = updatedAddressData.district;
        addressToUpdate.phones = updatedAddressData.phones;

        await user.save();
        console.log("status''true");
       res.redirect('/addressBook?success=true')
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



  //-------------------------- get address book -------------------------------
//===========================================================================

const getAddressBook = async(req,res)=>{
    try {
      const userId = req.session.user;
  
      if (!userId) {
        return res.redirect('/login');
      }
      const user = await userModel.findById(userId)
      const addresses = user.address;
      res.render('./users/addressBook',{user,addresses});
    } catch (error) {
      console.error(error.message)
    }
  }
    

  module.exports = {
    setDefaultAddress,
    deleteAddress,
    addAddress,
    updateAddress,
    getUserProfile,
    updateUserProfile,
    getAddressBook,
    addAddressCheckout
  }