'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

const userService = require('../services/user');
const { AZURE_AUTH } = require('../modules/secrets');

module.exports = function() {
    // Configure standard user sign-in (eg. members of the public)
    passport.use(
        new LocalStrategy((username, password, done) => {
            userService
                .findByUsername(username)
                .then(user => {
                    // use generic error messages here to avoid exposing existing accounts
                    let genericError = 'Your username and password combination is invalid';
                    if (!user) {
                        return done(null, false, { message: genericError });
                    }
                    if (!user.isValidPassword(user.password, password)) {
                        return done(null, false, { message: genericError });
                    }
                    return done(null, user);
                })
                .catch(err => {
                    return done(err);
                });
        })
    );

    // Configure staff user sign-in (eg. internal authentication)
    passport.use(
        new OIDCStrategy(
            {
                identityMetadata: AZURE_AUTH.MS_IDENTITY_URL,
                clientID: AZURE_AUTH.MS_CLIENT_ID,
                allowHttpForRedirectUrl: AZURE_AUTH.MS_ALLOW_HTTP,
                redirectUrl: AZURE_AUTH.MS_REDIRECT_URL,
                clientSecret: AZURE_AUTH.MS_CLIENT_SECRET,
                cookieEncryptionKeys: [
                    {
                        key: AZURE_AUTH.COOKIES.ONE.KEY,
                        iv: AZURE_AUTH.COOKIES.ONE.IV
                    },
                    {
                        key: AZURE_AUTH.COOKIES.TWO.KEY,
                        iv: AZURE_AUTH.COOKIES.TWO.IV
                    }
                ],
                responseType: 'code id_token',
                responseMode: 'form_post',
                validateIssuer: true,
                isB2C: false,
                issuer: null,
                passReqToCallback: false,
                scope: null,
                loggingLevel: 'info',
                nonceLifetime: null,
                nonceMaxAmount: 5,
                useCookieInsteadOfSession: true,
                clockSkew: null
            },
            (iss, sub, profile, accessToken, refreshToken, done) => {
                if (!profile.oid) {
                    return done(new Error('No oid found'), null);
                }
                // asynchronous verification, for effect...
                process.nextTick(() => {
                    userService.findStaffUser(profile.oid, (err, user) => {
                        if (err) {
                            return done(err);
                        }
                        if (!user) {
                            userService
                                .createStaffUser(profile)
                                .then(() => {
                                    return done(null, profile);
                                })
                                .catch(() => {
                                    return done(null, user);
                                });
                        }
                        return done(null, user);
                    });
                });
            }
        )
    );

    passport.serializeUser((user, cb) => {
        cb(null, {
            userType: user.constructor.name,
            userData: user
        });
    });

    passport.deserializeUser((user, cb) => {
        if (user.userType === 'user') {
            userService
                .findById(user.userData.id)
                .then(userObj => {
                    cb(null, userObj);
                })
                .catch(err => {
                    return cb(err);
                });
        } else if (user.userType === 'staff') {
            userService.findStaffUserById(user.userData.id)
                .then(staffUser => {
                    cb(null, staffUser);
                })
                .catch(err => {
                    return cb(err);
                });
        }
    });

    return [passport.initialize(), passport.session()];
};
