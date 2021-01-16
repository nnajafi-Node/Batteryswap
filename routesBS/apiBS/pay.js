/**
 * use express,mongoose,passport,zarinpal-checkout module
 * Swap fee payment
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const ZarinpalCheckout = require('zarinpal-checkout');
const Pay = require('../../modelsBS/Pay');
const Profile = require('../../modelsBS/userBS');
const zarinpal = ZarinpalCheckout.create('ceace242-7185-11e9-af82-000c29344814', false);

/**
 * @summary Request payment to ZarrinPal
 * @param Amount,CallbackURL,Description,Email,Mobile
 * @returns status - 400 if error occurs, 200 if successful.
 */
router.post('/paymentRequest', (req, res) => {
	zarinpal.PaymentRequest({
		Amount: req.body.Amount, //String & Tomans
		CallbackURL: req.body.CallbackURL, // 'http://XYZ.com',
		Description: req.body.Description, // 'افزایش اعتبار 10000 تومانی',
		Email: req.body.Email, // Optional 'b@s.com',
		Mobile: req.body.Mobile //Optional '09120000000'
    })
    .then(function (response) {
		if (response.status == 100) {
			res.status(200).send(response);
		}
    })
    .catch(function (err) {
		res.status(400).json({
			paymentRequestError: err
		});
	});
});

/**
 * @summary Record payment records
 * @param Amount,RefID,Description
 * @returns status - 400 if error occurs, 200 if successful.
 */
router.post('/paymentRecord', passport.authenticate('jwt', {session: false}), (req, res) => {
	let balance = 0;
	Profile.findOne({
        _id: req.user.id
    })
    .then(profile => {
        if (profile) {
            balance = profile.currency;
            Profile.findOneAndUpdate({
                _id: req.user.id
            }, {
                $set: {
                    currency: (balance + req.body.Amount)
                }
            }, {
                new: true
            }).then(profile => {
                return res.json(profile).end();
            }).catch(err => {return res.status(400).json(err)});
        }
    }).then(() => {
        const newPay = new Pay({
            user: req.user.id,
            Amount: req.body.Amount,
            Description: req.body.Description,
            RefID: req.body.RefID
        });
        newPay.save().then(pay => {return res.json(pay)}).catch(err => {return res.status(400).json(err)});
    })
    .catch(err => {return res.status(400).json(err)});
})

/**
 * @summary Payment confirmation
 * @param Amount,RefID,Description
 * @returns status - 400 if error occurs, 200 if successful.
 */
router.post('/paymentVerification', (req, res) => {
	zarinpal.PaymentVerification({
		Amount: req.body.Amount,
		Authority: req.body.Authority, //16digit
	}).then(function (response) {
		if (response.status == 101 || response.status == 100) {
			res.status(200).json({
				verifyStatus: response.status,
				RefID: response.RefID
			});
		} else {
			res.status(400).json({
				verifyStatus: response.status,
				RefID: "NO"
			});
		}
	}).catch(function (err) {
		res.status(400).json({
			paymentVerificationError: err
		});
		console.log(err);
	});
});
/**
 * Route: UnverifiedTransactions [module]
 * @return {Object} authorities [List of Unverified transactions]
 */
router.get('/UnverifiedTransactions', function (req, res) {
	zarinpal.UnverifiedTransactions().then(function (response) {
		if (response.status == 100) {
			console.log(response.authorities);
		}
	}).catch(function (err) {
		console.log(err);
	});
});

//get Pays
router.get('/myPayments', passport.authenticate('jwt', {session: false}), (req, res) => {
	Pay.find({
        user: req.user.id
    })
    .then(resp => {
        res.status(200).json(resp)
    })
    .catch(err => res.status(404).json(err));
})

module.exports = router;