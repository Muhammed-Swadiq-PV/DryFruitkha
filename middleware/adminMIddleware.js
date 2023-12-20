const multer = require('multer');

const loggedIn = (req, res, next) => {
    try {
        if (req.session.admin) {
            next();
        } else {
            return res.redirect("/admin/login");
        }
    } catch (error) {
        console.log(error.message);
    }
};

const loggedout = (req, res, next) => {
    try {
        if (!req.session.admin) {
            next();
        } else {
            return res.redirect('/admin/adminDashboard');
        }
    } catch (error) {
        console.log(error.message);
    }
};

const configureMulter = () => {
    const storage = multer.diskStorage({
        destination: 'public/images',
        filename: function (req, file, cb) {
            const uniqueSuffix = `${Date.now()}-${file.originalname}`;
            cb(null, uniqueSuffix);
        },
    });

    const upload = multer({ storage: storage });

    return upload;
};

module.exports = { loggedIn, loggedout, configureMulter };
